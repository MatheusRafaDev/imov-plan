using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlanejamentoController : ControllerBase
    {
        private readonly IPlanejamentoRepository _planejamentoRepository;
        private readonly ICalculoFinanceiroService _calculoService;
        private readonly IParticipanteRepository _participanteRepository;
        private readonly IAporteExtraRepository _aporteExtraRepository;

        public PlanejamentoController(
            IPlanejamentoRepository planejamentoRepository,
            ICalculoFinanceiroService calculoService,
            IParticipanteRepository participanteRepository,
            IAporteExtraRepository aporteExtraRepository)
        {
            _planejamentoRepository = planejamentoRepository;
            _calculoService = calculoService;
            _participanteRepository = participanteRepository;
            _aporteExtraRepository = aporteExtraRepository;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var planejamento = await _planejamentoRepository.GetByIdAsync(id);
            if (planejamento == null) return NotFound();
            return Ok(planejamento);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Planejamento planejamento)
        {
            var created = await _planejamentoRepository.CreateAsync(planejamento);

            // Auto-calculate and persist CustosCompra subdocument
            var valorEntrada = _calculoService.CalcularEntrada(planejamento.ValorImovel, planejamento.PercentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(planejamento.ValorImovel);
            var totalNecessario = valorEntrada + (planejamento.ValorImovel * planejamento.PercentualCustosExtras / 100m);

            created.CustosCompra = new CustosCompra
            {
                ValorEntrada = valorEntrada,
                TotalNecessario = totalNecessario,
                CustoITBI = custos.CustoITBI,
                CustoEscritura = custos.CustoEscritura,
                CustoRegistro = custos.CustoRegistro,
                CalculadoEm = System.DateTime.UtcNow,
            };

            await _planejamentoRepository.UpdateAsync(created.Id, created);

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Planejamento planejamento)
        {
            // Recalculate and persist CustosCompra subdocument
            var valorEntrada = _calculoService.CalcularEntrada(planejamento.ValorImovel, planejamento.PercentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(planejamento.ValorImovel);
            var totalNecessario = valorEntrada + (planejamento.ValorImovel * planejamento.PercentualCustosExtras / 100m);

            planejamento.CustosCompra = new CustosCompra
            {
                ValorEntrada = valorEntrada,
                TotalNecessario = totalNecessario,
                CustoITBI = custos.CustoITBI,
                CustoEscritura = custos.CustoEscritura,
                CustoRegistro = custos.CustoRegistro,
                CalculadoEm = System.DateTime.UtcNow,
            };

            await _planejamentoRepository.UpdateAsync(id, planejamento);

            return NoContent();
        }

        [HttpGet("{id}/diagnostico")]
        public async Task<IActionResult> GetDiagnostico(string id)
        {
            var planejamento = await _planejamentoRepository.GetByIdAsync(id);
            if (planejamento == null) return NotFound();

            var participantes = new System.Collections.Generic.List<Participante>();
            foreach (var pid in planejamento.ParticipantesIds)
            {
                var participante = await _participanteRepository.GetByIdAsync(pid);
                if (participante != null) participantes.Add(participante);
            }

            // Get totalNecessario from CustosCompra subdocument
            var totalNecessario = planejamento.CustosCompra?.TotalNecessario ?? 0m;

            // Calculate ValorJaGuardado from Participante.PatrimonioInicial
            var valorJaGuardado = participantes.Sum(p => p.PatrimonioInicial?.Valor ?? 0);

            // Fetch AportesExtras total
            var aportesExtras = await _aporteExtraRepository.GetByPlanejamentoIdAsync(id);
            var aportesExtrasTotal = valorJaGuardado + aportesExtras.Sum(a => a.Valor);

            var diagnostico = _calculoService.CalcularDiagnostico(participantes, totalNecessario, aportesExtrasTotal);
            return Ok(diagnostico);
        }

        [HttpPost("{id}/aportes-extras")]
        public async Task<IActionResult> AddAporteExtra(string id, [FromBody] AporteExtra aporte)
        {
            var planejamento = await _planejamentoRepository.GetByIdAsync(id);
            if (planejamento == null) return NotFound();

            aporte.PlanejamentoId = id;
            var created = await _aporteExtraRepository.AddAsync(aporte);
            return Ok(created);
        }
    }
}
