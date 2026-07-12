using System;
using System.Threading;
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

        // Endpoint legado (não-streaming) — mantido para compatibilidade
        [HttpPost("analisar")]
        public async Task<IActionResult> AnalisarPerfil([FromBody] ConsultoriaRequestDto request)
        {
            if (request == null || request.Pessoas == null || request.Pessoas.Count == 0)
            {
                return BadRequest(new { message = "Dados do usuário são obrigatórios para a análise." });
            }

            try
            {
                var resultText = await _aiService.GetConsultoriaAsync(request);
                return Ok(new { text = resultText });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro na Consultoria de IA.");
                return StatusCode(500, new { message = "Falha ao processar a consultoria da IA no servidor." });
            }
        }

        // Endpoint de streaming via SSE
        [HttpPost("analisar/stream")]
        public async Task AnalisarStream([FromBody] ConsultoriaRequestDto request, CancellationToken cancellationToken)
        {
            if (request == null || request.Pessoas == null || request.Pessoas.Count == 0)
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("{\"message\":\"Dados do usuário são obrigatórios para a análise.\"}", cancellationToken);
                return;
            }

            Response.Headers["Content-Type"] = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["X-Accel-Buffering"] = "no"; // desativa buffering no nginx/proxy

            try
            {
                await foreach (var chunk in _aiService.GetConsultoriaStreamAsync(request, cancellationToken))
                {
                    if (cancellationToken.IsCancellationRequested) break;

                    // Formato SSE: "data: <payload>\n\n"
                    var escaped = chunk.Replace("\n", "\\n");
                    await Response.WriteAsync($"data: {escaped}\n\n", cancellationToken);
                    await Response.Body.FlushAsync(cancellationToken);
                }

                // Sinaliza fim do stream
                await Response.WriteAsync("data: [DONE]\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
            catch (OperationCanceledException)
            {
                // Cliente desconectou — normal em SSE
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no streaming da Consultoria de IA.");
                if (!Response.HasStarted)
                {
                    Response.StatusCode = 500;
                    await Response.WriteAsync("{\"message\":\"Falha ao processar o streaming da IA.\"}", cancellationToken);
                }
            }
        }
    }
}
