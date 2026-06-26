using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

        public ParticipanteController(IParticipanteRepository participanteRepository)
        {
            _participanteRepository = participanteRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId))
                return BadRequest("planejamentoId is required.");

            var allParticipantes = await _participanteRepository.GetByPlanejamentoIdAsync(planejamentoId);
            return Ok(allParticipantes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var participante = await _participanteRepository.GetByIdAsync(id);
            if (participante == null) return NotFound();
            return Ok(participante);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Participante participante)
        {
            var created = await _participanteRepository.CreateAsync(participante);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Participante participante)
        {
            await _participanteRepository.UpdateAsync(id, participante);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _participanteRepository.DeleteAsync(id);
            return NoContent();
        }
    }
}
