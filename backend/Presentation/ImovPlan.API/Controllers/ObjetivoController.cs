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
    public class ObjetivoController : ControllerBase
    {
        private readonly IObjetivoRepository _objetivoRepository;
        private readonly ICalculoFinanceiroService _calculoService;
        private readonly IPessoaRepository _pessoaRepository;

        public ObjetivoController(
            IObjetivoRepository objetivoRepository, 
            ICalculoFinanceiroService calculoService,
            IPessoaRepository pessoaRepository)
        {
            _objetivoRepository = objetivoRepository;
            _calculoService = calculoService;
            _pessoaRepository = pessoaRepository;
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
            // Auto-calculate properties
            objetivo.ValorEntrada = _calculoService.CalcularEntrada(objetivo.ValorImovel, objetivo.PercentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(objetivo.ValorImovel);
            objetivo.CustoITBI = custos.CustoITBI;
            objetivo.CustoEscritura = custos.CustoEscritura;
            objetivo.CustoRegistro = custos.CustoRegistro;
            objetivo.TotalNecessario = objetivo.ValorEntrada + custos.CustoITBI + custos.CustoEscritura + custos.CustoRegistro;

            var created = await _objetivoRepository.CreateAsync(objetivo);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] ObjetivoImovel objetivo)
        {
            // Recalculate properties if needed
            objetivo.ValorEntrada = _calculoService.CalcularEntrada(objetivo.ValorImovel, objetivo.PercentualEntrada);
            var custos = _calculoService.CalcularCustosExtras(objetivo.ValorImovel);
            objetivo.CustoITBI = custos.CustoITBI;
            objetivo.CustoEscritura = custos.CustoEscritura;
            objetivo.CustoRegistro = custos.CustoRegistro;
            objetivo.TotalNecessario = objetivo.ValorEntrada + custos.CustoITBI + custos.CustoEscritura + custos.CustoRegistro;

            await _objetivoRepository.UpdateAsync(id, objetivo);
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

            var diagnostico = _calculoService.CalcularDiagnostico(pessoas, objetivo);
            return Ok(diagnostico);
        }

        [HttpPost("{id}/aportes-extras")]
        public async Task<IActionResult> AddAporteExtra(string id, [FromBody] AporteExtra aporte)
        {
            var objetivo = await _objetivoRepository.GetByIdAsync(id);
            if (objetivo == null) return NotFound();

            objetivo.AportesExtras.Add(aporte);
            await _objetivoRepository.UpdateAsync(id, objetivo);
            return Ok(objetivo);
        }
    }
}
