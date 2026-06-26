using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SimulacaoController : ControllerBase
    {
        private readonly ISimulacaoService _simulacaoService;
        private readonly IPlanejamentoRepository _planejamentoRepository;

        public SimulacaoController(
            ISimulacaoService simulacaoService,
            IPlanejamentoRepository planejamentoRepository)
        {
            _simulacaoService = simulacaoService;
            _planejamentoRepository = planejamentoRepository;
        }

        [HttpPost]
        public async Task<IActionResult> Simular([FromBody] SimulacaoRequestDto request)
        {
            var planejamento = await _planejamentoRepository.GetByIdAsync(request.ObjetivoId);
            if (planejamento == null) return NotFound("Planejamento não encontrado");

            // Get totalNecessario from CustosCompra subdocument
            var totalNecessario = planejamento.CustosCompra?.TotalNecessario ?? 0m;

            var resultado = await _simulacaoService.ExecutarSimulacaoAsync(
                request,
                planejamento,
                totalNecessario,
                origem: "manual");

            return Ok(resultado);
        }
    }
}
