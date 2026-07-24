using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
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
                Role = "User",
                Provider = "local"
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
                    // Novo usuário via Google — provider exclusivamente Google
                    user = new Usuario
                    {
                        Nome = payload.Name ?? "Usuário Google",
                        Email = payload.Email,
                        PasswordHash = "", // Sem senha para login social
                        Role = "User",
                        Provider = "google"
                    };

                    // Try to extract birth date from Google payload if available
                    var birthDate = payload.GetType().GetProperty("birthdate")?.GetValue(payload)?.ToString();
                    if (!string.IsNullOrEmpty(birthDate) && DateTime.TryParse(birthDate, out var parsedBirthDate))
                    {
                        user.DataNascimento = parsedBirthDate;
                    }

                    await _usuarioRepository.CreateAsync(user);
                }
                else if (user.Provider == "local" || string.IsNullOrEmpty(user.Provider))
                {
                    // Usuário local que agora também usa Google → conta híbrida
                    user.Provider = "both";
                    await _usuarioRepository.UpdateAsync(user.Id, user);
                }
                // Se provider == "google" ou "both", apenas autentica sem alterar

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

        /// <summary>
        /// Solicita recuperação de senha. Gera token seguro e envia link por email.
        /// Retorna 404 se o email não existir e 400 se a conta for exclusivamente Google.
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _usuarioRepository.GetByEmailAsync(request.Email);

            if (user == null)
            {
                return NotFound(new { message = "Não encontramos nenhuma conta vinculada a esse e-mail. Verifique o endereço informado." });
            }

            // Bloquear contas exclusivamente Google (sem senha local)
            if (user.Provider == "google")
            {
                return BadRequest(new
                {
                    message = "Esta conta utiliza autenticação pelo Google. Para acessar, clique em \"Entrar com Google\" na tela de login.",
                    provider = "google"
                });
            }

            // Gerar token bruto criptograficamente seguro (32 bytes = 256 bits de entropia)
            var tokenBytes = new byte[32];
            RandomNumberGenerator.Fill(tokenBytes);
            var rawToken = Convert.ToBase64String(tokenBytes)
                .Replace("+", "-").Replace("/", "_").Replace("=", ""); // URL-safe Base64

            // Persistir apenas o hash SHA-256 do token (nunca o token bruto)
            var tokenHash = ComputeSha256Hash(rawToken);

            // Invalidar qualquer token anterior e salvar o novo (só um token válido por vez)
            user.ResetPasswordToken = tokenHash;
            user.ResetPasswordExpiry = DateTime.UtcNow.AddMinutes(30);
            user.ResetPasswordTokenUsed = false;
            await _usuarioRepository.UpdateAsync(user.Id, user);

            var frontendUrl = _configuration["FrontendUrl"] ?? _configuration["FrontendUrl2"] ?? "http://localhost:3000";
            frontendUrl = frontendUrl.TrimEnd('/');
            var resetLink = $"{frontendUrl}/auth/reset-password?token={Uri.EscapeDataString(rawToken)}";

            var subject = "Redefinição de Senha — ImovPlan";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;'>
                    <div style='background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);'>
                        <h2 style='color: #E63946; margin-top: 0;'>Redefinição de Senha</h2>
                        <p>Olá, <strong>{user.Nome}</strong>!</p>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>ImovPlan</strong>.</p>
                        <p>Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>30 minutos</strong> e só pode ser usado uma vez.</p>
                        <div style='margin: 32px 0; text-align: center;'>
                            <a href='{resetLink}' style='background-color: #E63946; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;'>Redefinir minha senha</a>
                        </div>
                        <p style='color: #666; font-size: 13px;'>Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.</p>
                        <hr style='border: none; border-top: 1px solid #eee; margin: 24px 0;'>
                        <p style='color: #999; font-size: 12px;'>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                        <a href='{resetLink}' style='color: #E63946; word-break: break-all;'>{resetLink}</a></p>
                    </div>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(user.Email, subject, body, true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao enviar email de recuperação para {Email}", user.Email);
                return StatusCode(500, new { message = "Não foi possível enviar o e-mail de recuperação. Tente novamente em instantes." });
            }

            return Ok(new { message = "Link de recuperação enviado com sucesso. Verifique sua caixa de entrada (e a pasta de spam)." });
        }

        /// <summary>
        /// Valida se um token de reset ainda é válido (não expirado, não usado).
        /// Usado pelo frontend antes de exibir o formulário de nova senha.
        /// </summary>
        [HttpGet("validate-reset-token")]
        public async Task<IActionResult> ValidateResetToken([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return BadRequest(new { message = "Token inválido." });

            var tokenHash = ComputeSha256Hash(token);
            var user = await _usuarioRepository.GetByResetTokenHashAsync(tokenHash);

            if (user == null)
                return BadRequest(new { message = "Link de recuperação inválido ou já utilizado." });

            if (user.ResetPasswordTokenUsed)
                return BadRequest(new { message = "Este link já foi utilizado. Solicite um novo link de recuperação." });

            if (user.ResetPasswordExpiry == null || user.ResetPasswordExpiry < DateTime.UtcNow)
                return BadRequest(new { message = "Este link expirou. Solicite um novo link de recuperação." });

            return Ok(new { message = "Token válido.", email = user.Email });
        }

        /// <summary>
        /// Redefine a senha usando o token recebido por email.
        /// O token identifica o usuário — email não é necessário na requisição.
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var tokenHash = ComputeSha256Hash(request.Token);
            var user = await _usuarioRepository.GetByResetTokenHashAsync(tokenHash);

            if (user == null)
                return BadRequest(new { message = "Link de recuperação inválido ou já utilizado." });

            if (user.ResetPasswordTokenUsed)
                return BadRequest(new { message = "Este link já foi utilizado. Solicite um novo link de recuperação." });

            if (user.ResetPasswordExpiry == null || user.ResetPasswordExpiry < DateTime.UtcNow)
                return BadRequest(new { message = "Este link expirou. Solicite um novo link de recuperação." });

            // Validação de força da senha (backup além do FluentValidation)
            if (!IsPasswordStrong(request.NewPassword))
                return BadRequest(new { message = "A senha deve ter pelo menos 8 caracteres, incluindo letras e números." });

            // Atualizar hash da senha com BCrypt
            user.PasswordHash = HashPassword(request.NewPassword);

            // Se a conta era somente Google e agora define senha local, torna-se híbrida
            if (user.Provider == "google")
                user.Provider = "both";

            // Invalidar token de uso único (marcar como usado e limpar)
            user.ResetPasswordTokenUsed = true;
            user.ResetPasswordToken = null;
            user.ResetPasswordExpiry = null;

            await _usuarioRepository.UpdateAsync(user.Id, user);

            _logger.LogInformation("Senha redefinida com sucesso para usuário {UserId}", user.Id);

            return Ok(new { message = "Senha redefinida com sucesso! Você já pode fazer login com a nova senha." });
        }

        // ── Helpers ─────────────────────────────────────────────────────────────

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

        /// <summary>
        /// Computa hash SHA-256 do token bruto para armazenamento seguro no banco.
        /// O token bruto nunca é persistido.
        /// </summary>
        private static string ComputeSha256Hash(string rawToken)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(rawToken);
            return Convert.ToBase64String(sha256.ComputeHash(bytes));
        }

        /// <summary>
        /// Valida se a senha tem pelo menos 8 caracteres, 1 letra e 1 número.
        /// </summary>
        private static bool IsPasswordStrong(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8) return false;
            var hasLetter = Regex.IsMatch(password, @"[a-zA-ZÀ-ÿ]");
            var hasDigit = Regex.IsMatch(password, @"[0-9]");
            return hasLetter && hasDigit;
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
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class GoogleAuthRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
