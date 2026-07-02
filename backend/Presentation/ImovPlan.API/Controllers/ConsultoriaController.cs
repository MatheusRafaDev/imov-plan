using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConsultoriaController : ControllerBase
    {
        private readonly IAiConsultingService _aiService;
        private readonly ILogger<ConsultoriaController> _logger;

        public ConsultoriaController(IAiConsultingService aiService, ILogger<ConsultoriaController> logger)
        {
            _aiService = aiService;
            _logger = logger;
        }

        [HttpPost("analisar")]
        public async Task<IActionResult> AnalisarPerfil([FromBody] ConsultoriaRequestDto request)
        {
            if (request == null || request.Pessoas == null || request.Pessoas.Count == 0)
            {
                return BadRequest(new { error = "Dados do usuário são obrigatórios para a análise." });
            }

            try
            {
                var resultText = await _aiService.GetConsultoriaAsync(request);

                return Ok(new { text = resultText });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro na Consultoria de IA.");
                return StatusCode(500, new { error = "Falha ao processar a consultoria da IA no servidor." });
            }
        }
    }
}
