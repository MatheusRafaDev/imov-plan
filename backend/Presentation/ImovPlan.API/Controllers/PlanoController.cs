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



        [HttpGet("user/{usuarioId}")]
        public async Task<IActionResult> GetDraftByUsuario(string usuarioId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim) || !usuarioIdClaim.Equals(usuarioId, StringComparison.OrdinalIgnoreCase))
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
            if (string.IsNullOrEmpty(usuarioIdClaim) || !usuarioIdClaim.Equals(usuarioId, StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = "Não encontrado." });

            var draft = await _planoService.GetOrCreateDraftForUserAsync(usuarioId);
            return Ok(draft);
        }



        [HttpGet("user/{usuarioId}/todos")]
        public async Task<IActionResult> GetTodosPlanos(string usuarioId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim) || !usuarioIdClaim.Equals(usuarioId, StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = "Não encontrado." });

            var planos = await _planoService.GetTodosResumosByUsuarioIdAsync(usuarioId);
            return Ok(planos);
        }

        [HttpPost("user/{usuarioId}/novo")]
        public async Task<IActionResult> CriarNovoPlano(string usuarioId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim) || !usuarioIdClaim.Equals(usuarioId, StringComparison.OrdinalIgnoreCase))
                return NotFound(new { message = "Não encontrado." });

            var draft = await _planoService.CreateNewDraftForUserAsync(usuarioId);
            return Ok(draft);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlano(string id)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim))
                return Unauthorized();

            var success = await _planoService.DeletePlanoAsync(id, usuarioIdClaim);
            if (!success)
                return NotFound(new { message = "Plano não encontrado ou não autorizado." });

            return Ok();
        }

        [HttpPost("{id}/link-user")]
        public async Task<IActionResult> LinkUser(string id, [FromQuery] string usuarioId)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim) || !usuarioIdClaim.Equals(usuarioId, StringComparison.OrdinalIgnoreCase))
                return Unauthorized(new { message = "Autenticação é obrigatória." });

            var success = await _planoService.LinkPlanoToUserAsync(id, usuarioId);
            if (!success)
                return NotFound(new { message = "Plano não encontrado ou pertence a outro usuário." });

            return Ok();
        }

        [HttpGet("draft/{id}")]
        public async Task<IActionResult> GetDraft(string id)
        {
            var usuarioIdClaim = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioIdClaim))
                return Unauthorized();

            var draft = await _planoService.GetDraftAsync(id, usuarioIdClaim);
            if (draft == null)
                return NotFound("Plano não encontrado ou não autorizado.");

            return Ok(draft);
        }

        [HttpPut("draft/{id}")]
        public async Task<IActionResult> UpdateDraft(string id, [FromBody] PlanoDraftDto draftDto)
        {
            try
            {
                var usuarioIdClaim = User.GetUsuarioId();
                if (string.IsNullOrEmpty(usuarioIdClaim))
                    return Unauthorized(new { message = "Autenticação é obrigatória." });

                var success = await _planoService.UpdateDraftAsync(id, draftDto, usuarioIdClaim);
                if (!success)
                    return NotFound(new { message = "Plano não encontrado ou não autorizado para atualização." });

                return Ok();
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Recurso não encontrado ao atualizar draft: {PlanoId}", id);
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Argumento inválido ao atualizar draft: {PlanoId}", id);
                return BadRequest(new { message = ex.Message });
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