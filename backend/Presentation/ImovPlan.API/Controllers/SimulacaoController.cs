using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimulacaoController : ControllerBase
    {
        private readonly ISimulacaoService _simulacaoService;
        private readonly IObjetivoRepository _objetivoRepository;

        public SimulacaoController(ISimulacaoService simulacaoService, IObjetivoRepository objetivoRepository)
        {
            _simulacaoService = simulacaoService;
            _objetivoRepository = objetivoRepository;
        }

        [HttpPost]
        public async Task<IActionResult> Simular([FromBody] SimulacaoRequestDto request)
        {
            var objetivo = await _objetivoRepository.GetByIdAsync(request.ObjetivoId);
            if (objetivo == null) return NotFound("Objetivo não encontrado");

            var resultado = _simulacaoService.ExecutarSimulacao(request, objetivo);
            return Ok(resultado);
        }
    }
}
