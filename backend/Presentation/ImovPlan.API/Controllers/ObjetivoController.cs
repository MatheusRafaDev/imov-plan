using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ObjetivoController : ControllerBase
    {
        private readonly IObjetivoRepository _objetivoRepository;
        private readonly ICalculoFinanceiroService _calculoService;
        private readonly IPessoaRepository _pessoaRepository;
        private readonly ICustosImovelRepository _custosRepository;
        private readonly IAporteExtraRepository _aporteExtraRepository;

        public ObjetivoController(
            IObjetivoRepository objetivoRepository,
            ICalculoFinanceiroService calculoService,
            IPessoaRepository pessoaRepository,
            ICustosImovelRepository custosRepository,
            IAporteExtraRepository aporteExtraRepository)
        {
            _objetivoRepository = objetivoRepository;
            _calculoService = calculoService;
            _pessoaRepository = pessoaRepository;
            _custosRepository = custosRepository;
            _aporteExtraRepository = aporteExtraRepository;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var objetivo = await _objetivoRepository.GetByIdAsync(id);
            if (objetivo == null) return NotFound();
            return Ok(objetivo);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ObjetivoImovel objetivo)
        {
            var created = await _objetivoRepository.CreateAsync(objetivo);

            // Auto-calculate and persist CustosImovel
            var valorEntrada = _calculoService.CalcularEntrada(objetivo.ValorImovel, objetivo.PercentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(objetivo.ValorImovel);
            var totalNecessario = valorEntrada + (objetivo.ValorImovel * objetivo.PercentualCustosExtras / 100m);

            await _custosRepository.UpsertAsync(new CustosImovel
            {
                ObjetivoImovelId = created.Id,
                ValorEntrada = valorEntrada,
                TotalNecessario = totalNecessario,
                PercentualCustosExtras = objetivo.PercentualCustosExtras,
                CustoITBI = custos.CustoITBI,
                CustoEscritura = custos.CustoEscritura,
                CustoRegistro = custos.CustoRegistro,
            });

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] ObjetivoImovel objetivo)
        {
            await _objetivoRepository.UpdateAsync(id, objetivo);

            // Recalculate and persist CustosImovel
            var valorEntrada = _calculoService.CalcularEntrada(objetivo.ValorImovel, objetivo.PercentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(objetivo.ValorImovel);
            var totalNecessario = valorEntrada + (objetivo.ValorImovel * objetivo.PercentualCustosExtras / 100m);

            await _custosRepository.UpsertAsync(new CustosImovel
            {
                ObjetivoImovelId = id,
                ValorEntrada = valorEntrada,
                TotalNecessario = totalNecessario,
                PercentualCustosExtras = objetivo.PercentualCustosExtras,
                CustoITBI = custos.CustoITBI,
                CustoEscritura = custos.CustoEscritura,
                CustoRegistro = custos.CustoRegistro,
                CalculadoEm = System.DateTime.UtcNow,
            });

            return NoContent();
        }

        [HttpGet("{id}/diagnostico")]
        public async Task<IActionResult> GetDiagnostico(string id)
        {
            var objetivo = await _objetivoRepository.GetByIdAsync(id);
            if (objetivo == null) return NotFound();

            var pessoas = new System.Collections.Generic.List<Pessoa>();
            foreach (var pid in objetivo.PessoasIds)
            {
                var pessoa = await _pessoaRepository.GetByIdAsync(pid);
                if (pessoa != null) pessoas.Add(pessoa);
            }

            // Fetch CustosImovel for totalNecessario
            var custosImovel = await _custosRepository.GetByObjetivoIdAsync(id);
            var totalNecessario = custosImovel?.TotalNecessario ?? 0m;

            // Fetch AportesExtras total
            var aportesExtras = await _aporteExtraRepository.GetByObjetivoIdAsync(id);
            var aportesExtrasTotal = objetivo.ValorJaGuardado + aportesExtras.Sum(a => a.Valor);

            var diagnostico = _calculoService.CalcularDiagnostico(pessoas, totalNecessario, aportesExtrasTotal);
            return Ok(diagnostico);
        }

        [HttpPost("{id}/aportes-extras")]
        public async Task<IActionResult> AddAporteExtra(string id, [FromBody] AporteExtra aporte)
        {
            var objetivo = await _objetivoRepository.GetByIdAsync(id);
            if (objetivo == null) return NotFound();

            aporte.ObjetivoImovelId = id;
            var created = await _aporteExtraRepository.AddAsync(aporte);
            return Ok(created);
        }
    }
}
