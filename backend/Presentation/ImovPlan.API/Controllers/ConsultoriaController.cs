using System;
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
    public class ConsultoriaController : ControllerBase
    {
        private readonly IAiConsultingService _aiService;

        public ConsultoriaController(IAiConsultingService aiService)
        {
            _aiService = aiService;
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
                Console.WriteLine($"Erro na Consultoria de IA: {ex}");
                return StatusCode(500, new { error = "Falha ao processar a consultoria da IA no servidor." });
            }
        }
    }
}
