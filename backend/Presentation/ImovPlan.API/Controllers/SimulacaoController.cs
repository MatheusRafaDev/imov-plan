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
        private readonly IObjetivoRepository _objetivoRepository;
        private readonly ICustosImovelRepository _custosRepository;

        public SimulacaoController(
            ISimulacaoService simulacaoService,
            IObjetivoRepository objetivoRepository,
            ICustosImovelRepository custosRepository)
        {
            _simulacaoService = simulacaoService;
            _objetivoRepository = objetivoRepository;
            _custosRepository = custosRepository;
        }

        [HttpPost]
        public async Task<IActionResult> Simular([FromBody] SimulacaoRequestDto request)
        {
            var objetivo = await _objetivoRepository.GetByIdAsync(request.ObjetivoId);
            if (objetivo == null) return NotFound("Objetivo não encontrado");

            var custos = await _custosRepository.GetByObjetivoIdAsync(request.ObjetivoId);
            var totalNecessario = custos?.TotalNecessario ?? 0m;

            var resultado = await _simulacaoService.ExecutarSimulacaoAsync(
                request,
                objetivo,
                totalNecessario,
                origem: "manual");

            return Ok(resultado);
        }
    }
}
