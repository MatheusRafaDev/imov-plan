using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.API.Extensions;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ParticipanteController : ControllerBase
    {
        private readonly IParticipanteRepository _participanteRepository;
        private readonly IPlanejamentoRepository _planejamentoRepository;

        public ParticipanteController(
            IParticipanteRepository participanteRepository,
            IPlanejamentoRepository planejamentoRepository)
        {
            _participanteRepository = participanteRepository;
            _planejamentoRepository = planejamentoRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId))
                return BadRequest(new { message = "planejamentoId is required." });

            var usuarioId = User.GetUsuarioId();
            var planejamento = await _planejamentoRepository.GetByIdAsync(planejamentoId);
            if (planejamento == null || string.IsNullOrEmpty(usuarioId) || planejamento.UsuarioId != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            var allParticipantes = await _participanteRepository.GetByPlanejamentoIdAsync(planejamentoId);
            return Ok(allParticipantes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var usuarioId = User.GetUsuarioId();
            var participante = await _participanteRepository.GetByIdAsync(id);
            if (participante == null || string.IsNullOrEmpty(usuarioId))
                return NotFound(new { message = "Não encontrado." });

            var planejamento = await _planejamentoRepository.GetByIdAsync(participante.PlanejamentoId);
            if (planejamento == null || planejamento.UsuarioId != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            return Ok(participante);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Participante participante)
        {
            var usuarioId = User.GetUsuarioId();
            if (participante == null || string.IsNullOrEmpty(participante.PlanejamentoId) || string.IsNullOrEmpty(usuarioId))
                return BadRequest(new { message = "Dados de participante inválidos." });

            var planejamento = await _planejamentoRepository.GetByIdAsync(participante.PlanejamentoId);
            if (planejamento == null || planejamento.UsuarioId != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            var created = await _participanteRepository.CreateAsync(participante);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Participante participante)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId))
                return NotFound(new { message = "Não encontrado." });

            var existing = await _participanteRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Não encontrado." });

            var planejamento = await _planejamentoRepository.GetByIdAsync(existing.PlanejamentoId);
            if (planejamento == null || planejamento.UsuarioId != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            participante.PlanejamentoId = existing.PlanejamentoId;
            await _participanteRepository.UpdateAsync(id, participante);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId))
                return NotFound(new { message = "Não encontrado." });

            var existing = await _participanteRepository.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Não encontrado." });

            var planejamento = await _planejamentoRepository.GetByIdAsync(existing.PlanejamentoId);
            if (planejamento == null || planejamento.UsuarioId != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            await _participanteRepository.DeleteAsync(id);
            return NoContent();
        }
    }
}
