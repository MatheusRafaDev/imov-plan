using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly ITokenService _tokenService;

        public AuthController(IUsuarioRepository usuarioRepository, ITokenService tokenService)
        {
            _usuarioRepository = usuarioRepository;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existing = await _usuarioRepository.GetByEmailAsync(request.Email);
            if (existing != null)
                return BadRequest(new { message = "Email já cadastrado." });

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
            Response.Cookies.Delete("token");
            return Ok(new { message = "Logout com sucesso." });
        }

        private void SetTokenCookie(string token)
        {
            var cookieOptions = new Microsoft.AspNetCore.Http.CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };
            Response.Cookies.Append("token", token, cookieOptions);
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

            // Simulação de envio de email
            Console.WriteLine($"[SIMULAÇÃO DE EMAIL] Para resetar a senha de {user.Email}, use o token: {user.ResetPasswordToken}");

            return Ok(new { message = "Se o email existir, um token de recuperação foi gerado (simulado no console)." });
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
}