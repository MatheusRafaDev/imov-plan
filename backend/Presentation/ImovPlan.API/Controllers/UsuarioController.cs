using System;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.API.Extensions;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IPlanoService _planoService;

        public UsuarioController(IUsuarioRepository usuarioRepository, IPlanoService planoService)
        {
            _usuarioRepository = usuarioRepository;
            _planoService = planoService;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId) || usuarioId != id)
                return NotFound(new { message = "Usuário não encontrado." });

            var user = await _usuarioRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "Usuário não encontrado." });

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                name = user.Nome,
                dataNascimento = user.DataNascimento?.ToString("yyyy-MM-dd"),
                createdAt = user.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUsuarioRequest request)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId) || usuarioId != id)
                return NotFound(new { message = "Usuário não encontrado." });

            var existing = await _usuarioRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Usuário não encontrado." });

            if (request.Name != null)
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                    return BadRequest(new { message = "O nome é obrigatório." });

                existing.Nome = request.Name.Trim();
            }

            if (request.DataNascimento == null)
            {
                existing.DataNascimento = null;
            }
            else if (DateTime.TryParseExact(
                request.DataNascimento,
                "yyyy-MM-dd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out var parsed))
            {
                existing.DataNascimento = parsed;
            }
            else
            {
                return BadRequest(new { message = "Data de nascimento inválida." });
            }

            await _usuarioRepository.UpdateAsync(id, existing);

            return Ok(new
            {
                id = existing.Id,
                email = existing.Email,
                name = existing.Nome,
                dataNascimento = existing.DataNascimento?.ToString("yyyy-MM-dd"),
                createdAt = existing.CreatedAt
            });
        }

        [HttpPatch("{id}/senha")]
        public async Task<IActionResult> ChangePassword(string id, [FromBody] ChangePasswordRequest request)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId) || usuarioId != id)
                return NotFound(new { message = "Usuário não encontrado." });

            if (string.IsNullOrWhiteSpace(request.SenhaAtual) || string.IsNullOrWhiteSpace(request.NovaSenha))
                return BadRequest(new { message = "Informe a senha atual e a nova senha." });

            if (!IsPasswordStrong(request.NovaSenha))
                return BadRequest(new { message = "A senha deve ter pelo menos 8 caracteres, incluindo letras e números." });

            var existing = await _usuarioRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Usuário não encontrado." });

            if (string.IsNullOrEmpty(existing.PasswordHash) || !VerifyPassword(request.SenhaAtual, existing.PasswordHash))
                return BadRequest(new { message = "A senha atual está incorreta ou esta conta não possui senha local." });

            existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha, workFactor: 12);
            await _usuarioRepository.UpdateAsync(id, existing);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId) || usuarioId != id)
                return NotFound(new { message = "Usuário não encontrado." });

            var existing = await _usuarioRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Usuário não encontrado." });

            await _planoService.DeleteAllUserDataAsync(id);
            await _usuarioRepository.DeleteAsync(id);
            return NoContent();
        }

        [HttpGet("exportar")]
        public async Task<IActionResult> ExportData()
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId))
                return Unauthorized(new { message = "Não autorizado." });

            var user = await _usuarioRepository.GetByIdAsync(usuarioId);
            if (user == null)
                return NotFound(new { message = "Usuário não encontrado." });

            var plano = await _planoService.GetDraftByUsuarioIdAsync(usuarioId);

            var exportData = new
            {
                Usuario = new
                {
                    user.Id,
                    user.Nome,
                    user.Email,
                    user.DataNascimento,
                    user.Provider,
                    user.Role,
                    user.CreatedAt
                },
                Planejamento = plano
            };

            var json = System.Text.Json.JsonSerializer.Serialize(exportData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            return File(bytes, "application/json", $"exportacao_dados_{usuarioId}.json");
        }

        private static bool VerifyPassword(string password, string passwordHash)
        {
            if (passwordHash.StartsWith("$2", StringComparison.Ordinal))
                return BCrypt.Net.BCrypt.Verify(password, passwordHash);

            // Compatibilidade com hashes SHA-256 antigos; o hash novo será salvo como BCrypt.
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password + "ImovPlanSalt2026");
            var legacyHash = Convert.ToBase64String(sha256.ComputeHash(bytes));
            return string.Equals(passwordHash, legacyHash, StringComparison.Ordinal);
        }

        private static bool IsPasswordStrong(string password)
        {
            if (password.Length < 8)
                return false;

            return Regex.IsMatch(password, @"[a-zA-Z\u00C0-\u00FF]") && Regex.IsMatch(password, @"[0-9]");
        }
    }


    public class UpdateUsuarioRequest
    {
        public string? Name { get; set; }
        public string? DataNascimento { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string SenhaAtual { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }

}
