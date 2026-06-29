using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Email e senha são obrigatórios." });

            var existing = await _usuarioRepository.GetByEmailAsync(request.Email);
            if (existing != null)
                return BadRequest(new { message = "Email já cadastrado." });

            DateTime? parsedNascimento = null;
            if (!string.IsNullOrWhiteSpace(request.DataNascimento))
            {
                if (!DateTime.TryParse(request.DataNascimento, out var parsed))
                {
                    return BadRequest(new { message = "Formato de data de nascimento inválido." });
                }

                var today = DateTime.Today;
                var age = today.Year - parsed.Year;
                if (parsed.Date > today.AddYears(-age)) age--;

                if (parsed > today)
                {
                    return BadRequest(new { message = "A data de nascimento não pode ser no futuro." });
                }
                if (age < 18)
                {
                    return BadRequest(new { message = "Você precisa ter pelo menos 18 anos para se cadastrar." });
                }
                if (age > 120)
                {
                    return BadRequest(new { message = "Insira uma data de nascimento válida." });
                }
                parsedNascimento = parsed;
            }
            else
            {
                return BadRequest(new { message = "A data de nascimento é obrigatória." });
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

            var token = _tokenService.GenerateJwtToken(user.Id, user.Role);

            return Ok(new
            {
                token = token,
                user = MapUserResponse(user)
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _usuarioRepository.GetByEmailAsync(request.Email);
            if (user == null)
                return Unauthorized(new { message = "Email ou senha inválidos." });

            bool senhaValida;
            if (user.PasswordHash.StartsWith("$2")) // hash bcrypt
            {
                senhaValida = VerifyPassword(request.Password, user.PasswordHash);
            }
            else
            {
                // Hash legado (SHA-256 + salt fixo) — valida e migra para bcrypt.
                senhaValida = user.PasswordHash == LegacyHashPassword(request.Password);
                if (senhaValida)
                {
                    user.PasswordHash = HashPassword(request.Password);
                    await _usuarioRepository.UpdateAsync(user.Id, user);
                }
            }

            if (!senhaValida)
                return Unauthorized(new { message = "Email ou senha inválidos." });

            var token = _tokenService.GenerateJwtToken(user.Id, user.Role);

            return Ok(new
            {
                token = token,
                user = MapUserResponse(user)
            });
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
}