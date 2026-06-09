using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IConfiguration _configuration;

        public AuthController(IUsuarioRepository usuarioRepository, IConfiguration configuration)
        {
            _usuarioRepository = usuarioRepository;
            _configuration = configuration;
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

            var token = GenerateJwtToken(user.Id);

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

            var token = GenerateJwtToken(user.Id);

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

        private string GenerateJwtToken(string userId)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "ImovPlanSecretKey2026ForJWTTokenGeneration";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "ImovPlanAPI";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "ImovPlanClient";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, userId)
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
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

