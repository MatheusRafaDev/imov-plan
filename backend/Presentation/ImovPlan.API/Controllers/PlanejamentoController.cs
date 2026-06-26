using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.API.Extensions;
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
            var usuarioId = User.GetUsuarioId();
            var planejamento = await _planejamentoRepository.GetByIdAsync(id);
            if (planejamento == null || string.IsNullOrEmpty(usuarioId) || planejamento.UsuarioId != usuarioId)
                return NotFound();

            return Ok(planejamento);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Planejamento planejamento)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId))
                return BadRequest("Usuário autenticado inválido.");

            planejamento.UsuarioId = usuarioId;
            planejamento.SessionId = null;
            planejamento.Status = planejamento.Status ?? "Draft";

            var created = await _planejamentoRepository.CreateAsync(planejamento);

            // Auto-calculate and persist CustosCompra subdocument
            var valorImovel = created.ValorImovel ?? 0m;
            var percentualEntrada = created.PercentualEntrada ?? 0m;
            var percentualCustosExtras = created.PercentualCustosExtras ?? 0m;
            var valorEntrada = _calculoService.CalcularEntrada(valorImovel, percentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(valorImovel);
            var totalNecessario = valorEntrada + (valorImovel * percentualCustosExtras / 100m);

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
            var usuarioId = User.GetUsuarioId();
            var existing = await _planejamentoRepository.GetByIdAsync(id);
            if (existing == null || string.IsNullOrEmpty(usuarioId) || existing.UsuarioId != usuarioId)
                return NotFound();

            // Preserve proprietário
            planejamento.UsuarioId = existing.UsuarioId;
            planejamento.SessionId = existing.SessionId;

            // Recalculate and persist CustosCompra subdocument
            var valorImovel = planejamento.ValorImovel ?? 0m;
            var percentualEntrada = planejamento.PercentualEntrada ?? 0m;
            var percentualCustosExtras = planejamento.PercentualCustosExtras ?? 0m;
            var valorEntrada = _calculoService.CalcularEntrada(valorImovel, percentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(valorImovel);
            var totalNecessario = valorEntrada + (valorImovel * percentualCustosExtras / 100m);

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
            var usuarioId = User.GetUsuarioId();
            var planejamento = await _planejamentoRepository.GetByIdAsync(id);
            if (planejamento == null || string.IsNullOrEmpty(usuarioId) || planejamento.UsuarioId != usuarioId)
                return NotFound();

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
            var usuarioId = User.GetUsuarioId();
            var planejamento = await _planejamentoRepository.GetByIdAsync(id);
            if (planejamento == null || string.IsNullOrEmpty(usuarioId) || planejamento.UsuarioId != usuarioId)
                return NotFound();

            aporte.PlanejamentoId = id;
            var created = await _aporteExtraRepository.AddAsync(aporte);
            return Ok(created);
        }
    }
}
