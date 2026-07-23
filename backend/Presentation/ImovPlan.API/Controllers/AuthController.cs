using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;
using Google.Apis.Auth;


namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUsuarioRepository usuarioRepository,
            ITokenService tokenService,
            IConfiguration configuration,
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _usuarioRepository = usuarioRepository;
            _tokenService = tokenService;
            _configuration = configuration;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existing = await _usuarioRepository.GetByEmailAsync(request.Email);
            if (existing != null)
                return BadRequest(new { message = "Não foi possível concluir o cadastro. Verifique os dados informados." });

            DateTime? parsedNascimento = null;
            if (DateTime.TryParse(request.DataNascimento, out var parsed))
            {
                parsedNascimento = parsed;
            }

            var user = new Usuario
            {
                Nome = request.Name ?? string.Empty,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                DataNascimento = parsedNascimento,
                Role = "User"
            };

            await _usuarioRepository.CreateAsync(user);

            var token = _tokenService.GenerateJwtToken(user.Id, user.Role ?? "User");
            SetTokenCookie(token);

            return Ok(new
            {
                user = MapUserResponse(user)
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {


            var user = await _usuarioRepository.GetByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized(new { message = "Email ou senha inválidos." });

            var passwordHash = user.PasswordHash ?? string.Empty;
            bool senhaValida = false;

            if (!string.IsNullOrEmpty(passwordHash))
            {
                if (passwordHash.StartsWith("$2")) // hash bcrypt
                {
                    senhaValida = VerifyPassword(request.Password, passwordHash);
                }
                else
                {
                    // Hash legado (SHA-256 + salt fixo) — valida e migra para bcrypt.
                    senhaValida = passwordHash == LegacyHashPassword(request.Password);
                    if (senhaValida)
                    {
                        user.PasswordHash = HashPassword(request.Password);
                        await _usuarioRepository.UpdateAsync(user.Id, user);
                    }
                }
            }

            if (!senhaValida)
                return Unauthorized(new { message = "Email ou senha inválidos." });

            var token = _tokenService.GenerateJwtToken(user.Id, user.Role ?? "User");
            SetTokenCookie(token);

            return Ok(new
            {
                user = MapUserResponse(user)
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("token", CreateTokenCookieOptions());
            return Ok(new { message = "Logout com sucesso." });
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthRequest request)
        {
            try
            {
                var clientId = _configuration["Google:ClientId"];
                if (string.IsNullOrEmpty(clientId))
                {
                    return StatusCode(500, new { message = "Google Client ID não configurado no servidor." });
                }

                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new[] { clientId }
                };

                GoogleJsonWebSignature.Payload payload;
                try
                {
                    payload = await GoogleJsonWebSignature.ValidateAsync(request.Token, settings);
                }
                catch (InvalidJwtException)
                {
                    return Unauthorized(new { message = "Token do Google inválido." });
                }

                if (!payload.EmailVerified)
                {
                    return Unauthorized(new { message = "E-mail do Google não verificado." });
                }

                var user = await _usuarioRepository.GetByEmailAsync(payload.Email);

                if (user == null)
                {
                    // Registra o usuário
                    user = new Usuario
                    {
                        Nome = payload.Name ?? "Usuário Google",
                        Email = payload.Email,
                        PasswordHash = "", // Sem senha para login social
                        Role = "User"
                    };

                    await _usuarioRepository.CreateAsync(user);
                }

                var token = _tokenService.GenerateJwtToken(user.Id, user.Role ?? "User");
                SetTokenCookie(token);

                return Ok(new
                {
                    user = MapUserResponse(user)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro interno ao validar login com Google.");
                return StatusCode(500, new { message = "Erro interno ao processar a solicitação." });
            }
        }

        private void SetTokenCookie(string token)
        {
            var cookieOptions = CreateTokenCookieOptions();
            cookieOptions.Expires = DateTime.UtcNow.AddDays(7);
            Response.Cookies.Append("token", token, cookieOptions);
        }

        private Microsoft.AspNetCore.Http.CookieOptions CreateTokenCookieOptions()
        {
            // The browser reaches the API through the Next.js /api proxy. A Secure
            // cookie is rejected when the app runs over HTTP (the local/Docker default).
            // HTTPS deployments can force it with Auth__CookieSecure=true.
            var configuredSecure = _configuration.GetValue<bool?>("Auth:CookieSecure");
            var forwardedProto = Request.Headers["X-Forwarded-Proto"].ToString();
            var isHttps = Request.IsHttps || string.Equals(forwardedProto, "https", StringComparison.OrdinalIgnoreCase);

            return new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Secure = configuredSecure ?? isHttps,
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Lax,
                Path = "/"
            };
        }

        private static object MapUserResponse(Usuario user)
        {
            return new
            {
                id = user.Id,
                email = user.Email,
                name = user.Nome,
                dataNascimento = user.DataNascimento?.ToString("yyyy-MM-dd")
            };
        }

        private static string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

        private static bool VerifyPassword(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);

        // Mantido apenas para migração de hashes legados
        private static string LegacyHashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password + "ImovPlanSalt2026");
            return Convert.ToBase64String(sha256.ComputeHash(bytes));
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _usuarioRepository.GetByEmailAsync(request.Email);
            if (user == null)
            {
                // Para não expor se o email existe, retornamos sucesso genérico
                return Ok(new { message = "Se o email existir, um token de recuperação foi gerado (simulado no console)." });
            }

            user.ResetPasswordToken = Guid.NewGuid().ToString();
            user.ResetPasswordExpiry = DateTime.UtcNow.AddHours(1);
            await _usuarioRepository.UpdateAsync(user.Id, user);

            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
            var resetLink = $"{frontendUrl}/auth/reset-password?token={user.ResetPasswordToken}&email={user.Email}";
            
            var subject = "Recuperação de Senha - ImovPlan";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #E63946;'>Recuperação de Senha</h2>
                    <p>Olá,</p>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>ImovPlan</strong>.</p>
                    <p>Se você não fez essa solicitação, pode ignorar este email.</p>
                    <div style='margin: 30px 0;'>
                        <a href='{resetLink}' style='background-color: #E63946; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>Redefinir Minha Senha</a>
                    </div>
                    <p style='color: #666; font-size: 12px;'>Este link expira em 1 hora.</p>
                </div>";

            await _emailService.SendEmailAsync(user.Email, subject, body, true);

            return Ok(new { message = "Se o email existir, um token de recuperação foi gerado." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = await _usuarioRepository.GetByEmailAsync(request.Email);
            if (user == null || user.ResetPasswordToken != request.Token || user.ResetPasswordExpiry < DateTime.UtcNow)
            {
                return BadRequest(new { message = "Token inválido ou expirado." });
            }

            user.PasswordHash = HashPassword(request.NewPassword);
            user.ResetPasswordToken = null;
            user.ResetPasswordExpiry = null;
            await _usuarioRepository.UpdateAsync(user.Id, user);

            return Ok(new { message = "Senha redefinida com sucesso." });
        }
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? DataNascimento { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class GoogleAuthRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
