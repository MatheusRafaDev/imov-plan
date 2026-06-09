using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsuarioController : ControllerBase
    {
        private readonly IUsuarioRepository _usuarioRepository;

        public UsuarioController(IUsuarioRepository usuarioRepository)
        {
            _usuarioRepository = usuarioRepository;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
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
    }

    public class UpdateUsuarioRequest
    {
        public string? Name { get; set; }
        public string? DataNascimento { get; set; }
    }
}
