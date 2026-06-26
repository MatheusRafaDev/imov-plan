using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlanoController : ControllerBase
    {
        private readonly IPlanoService _planoService;

        public PlanoController(IPlanoService planoService)
        {
            _planoService = planoService;
        }

        [HttpGet("draft")]
        public async Task<IActionResult> GetDraftBySession([FromQuery] string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId))
                return BadRequest("SessionId is required.");

            var draft = await _planoService.GetDraftBySessionIdAsync(sessionId);
            if (draft == null)
                return NotFound();

            return Ok(draft);
        }

        [HttpGet("user/{usuarioId}")]
        public async Task<IActionResult> GetDraftByUsuario(string usuarioId)
        {
            if (string.IsNullOrEmpty(usuarioId))
                return BadRequest("UsuarioId is required.");

            var draft = await _planoService.GetDraftByUsuarioIdAsync(usuarioId);
            if (draft == null)
                return NotFound();

            return Ok(draft);
        }

        [HttpPost("draft-for-user")]
        public async Task<IActionResult> GetOrCreateDraftForUser([FromQuery] string usuarioId)
        {
            if (string.IsNullOrEmpty(usuarioId))
                return BadRequest("UsuarioId is required.");

            var draft = await _planoService.GetOrCreateDraftForUserAsync(usuarioId);
            return Ok(draft);
        }

        [HttpPost("{id}/link-user")]
        public async Task<IActionResult> LinkPlanToUser(string id, [FromQuery] string usuarioId)
        {
            if (string.IsNullOrEmpty(usuarioId))
                return BadRequest("UsuarioId is required.");

            var success = await _planoService.LinkPlanToUserAsync(id, usuarioId);
            if (!success)
                return NotFound("Plano não encontrado.");

            return Ok();
        }

        [HttpPost("draft")]
        public async Task<IActionResult> CreateDraft([FromQuery] string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId))
                return BadRequest("SessionId is required.");

            var id = await _planoService.CreateDraftAsync(sessionId);
            return Ok(new { id });
        }

        [HttpGet("draft/{id}")]
        public async Task<IActionResult> GetDraft(string id, [FromQuery] string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId))
                return BadRequest("SessionId is required.");

            var draft = await _planoService.GetDraftAsync(id, sessionId);
            if (draft == null)
                return NotFound("Plano não encontrado ou não autorizado.");

            return Ok(draft);
        }

        [HttpPut("draft/{id}")]
        public async Task<IActionResult> UpdateDraft(string id, [FromBody] PlanoDraftDto draftDto)
        {
            try
            {
                if (string.IsNullOrEmpty(draftDto.SessionId))
                    return BadRequest("SessionId is required in the payload.");

                var success = await _planoService.UpdateDraftAsync(id, draftDto);
                if (!success)
                    return NotFound("Plano não encontrado ou não autorizado para atualização.");

                return Ok();
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        [HttpPost("{id}/concluir")]
        public async Task<IActionResult> ConcluirPlano(string id)
        {
            await _planoService.ConcluirPlanoAsync(id);
            return Ok();
        }
    }
}