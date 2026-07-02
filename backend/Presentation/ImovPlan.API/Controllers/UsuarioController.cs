using System;
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

            existing.Nome = request.Name ?? existing.Nome;

            if (!string.IsNullOrWhiteSpace(request.DataNascimento))
            {
                if (DateTime.TryParse(request.DataNascimento, out var parsed))
                    existing.DataNascimento = parsed;
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
                Usuario = user,
                Planejamento = plano
            };

            var json = System.Text.Json.JsonSerializer.Serialize(exportData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);
            return File(bytes, "application/json", $"exportacao_dados_{usuarioId}.json");
        }
    }


    public class UpdateUsuarioRequest
    {
        public string? Name { get; set; }
        public string? DataNascimento { get; set; }
    }
}
