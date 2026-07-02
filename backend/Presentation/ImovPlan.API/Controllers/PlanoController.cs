using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.API.Extensions;
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
        private readonly ILogger<PlanoController> _logger;

        public PlanoController(IPlanoService planoService, ILogger<PlanoController> logger)
        {
            _planoService = planoService;
            _logger = logger;
        }

        [HttpGet("draft")]
        public async Task<IActionResult> GetDraftBySession([FromQuery] string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId))
                return BadRequest(new { message = "SessionId is required." });

            var draft = await _planoService.GetDraftBySessionIdAsync(sessionId);
            if (draft == null)
                return NotFound(new { message = "Não encontrado." });

            return Ok(draft);
        }

        [HttpGet("user/{usuarioId}")]
        public async Task<IActionResult> GetDraftByUsuario(string usuarioId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim) || usuarioIdClaim != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            var draft = await _planoService.GetDraftByUsuarioIdAsync(usuarioId);
            if (draft == null)
                return NotFound(new { message = "Não encontrado." });

            return Ok(draft);
        }

        [HttpPost("draft-for-user")]
        public async Task<IActionResult> GetOrCreateDraftForUser([FromQuery] string usuarioId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim) || usuarioIdClaim != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            var draft = await _planoService.GetOrCreateDraftForUserAsync(usuarioId);
            return Ok(draft);
        }

        [HttpPost("{id}/link-user")]
        public async Task<IActionResult> LinkPlanToUser(string id, [FromQuery] string usuarioId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim) || usuarioIdClaim != usuarioId)
                return NotFound(new { message = "Não encontrado." });

            var success = await _planoService.LinkPlanToUserAsync(id, usuarioId);
            if (!success)
                return NotFound("Plano não encontrado.");

            return Ok();
        }

        [HttpPost("draft")]
        public async Task<IActionResult> CreateDraft([FromQuery] string sessionId)
        {
            if (string.IsNullOrEmpty(sessionId))
                return BadRequest(new { message = "SessionId is required." });

            var id = await _planoService.CreateDraftAsync(sessionId);
            return Ok(new { id });
        }

        [HttpGet("draft/{id}")]
        public async Task<IActionResult> GetDraft(string id, [FromQuery] string? sessionId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            var draft = await _planoService.GetDraftAsync(id, sessionId, usuarioIdClaim);
            if (draft == null)
                return NotFound("Plano não encontrado ou não autorizado.");

            return Ok(draft);
        }

        [HttpPut("draft/{id}")]
        public async Task<IActionResult> UpdateDraft(string id, [FromBody] PlanoDraftDto draftDto)
        {
            try
            {
                var usuarioIdClaim = User.GetUsuarioId(); // pode ser null no fluxo anônimo (sessionId)
                if (string.IsNullOrEmpty(draftDto.SessionId) && string.IsNullOrEmpty(usuarioIdClaim))
                    return BadRequest(new { message = "SessionId ou autenticação são obrigatórios." });

                var success = await _planoService.UpdateDraftAsync(id, draftDto, usuarioIdClaim);
                if (!success)
                    return NotFound("Plano não encontrado ou não autorizado para atualização.");

                return Ok();
            }
            catch (System.Exception ex)
            {
                // não retornar ex.ToString() ao cliente
                _logger.LogError(ex, "Erro ao atualizar draft: {PlanoId}", id);
                return StatusCode(500, new { message = "Erro interno ao atualizar o plano." });
            }
        }

        [HttpPost("{id}/concluir")]
        public async Task<IActionResult> ConcluirPlano(string id)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim))
                return Unauthorized();

            var success = await _planoService.ConcluirPlanoAsync(id, usuarioIdClaim);
            if (!success)
                return NotFound("Plano não encontrado ou não autorizado.");

            return Ok();
        }
    }
}