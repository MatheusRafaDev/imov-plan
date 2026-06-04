using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public AuthController(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
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
                DataNascimento = parsedNascimento
            };

            await _usuarioRepository.CreateAsync(user);

            var token = GenerateSimpleToken();

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
            if (user == null || user.PasswordHash != HashPassword(request.Password))
                return Unauthorized(new { message = "Email ou senha inválidos." });

            var token = GenerateSimpleToken();

            return Ok(new
            {
                token = token,
                user = MapUserResponse(user)
            });
        }

        private object MapUserResponse(Usuario user)
        {
            return new
            {
                id = user.Id,
                email = user.Email,
                name = user.Nome,
                dataNascimento = user.DataNascimento?.ToString("yyyy-MM-dd")
            };
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password + "ImovPlanSalt2026");
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        private string GenerateSimpleToken()
        {
            // Gera um token base64 simples que serve para simular um JWT
            var time = BitConverter.GetBytes(DateTime.UtcNow.ToBinary());
            var key = Guid.NewGuid().ToByteArray();
            return Convert.ToBase64String(time.Concat(key).ToArray());
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

