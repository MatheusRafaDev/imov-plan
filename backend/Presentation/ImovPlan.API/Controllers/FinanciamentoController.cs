using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FinanciamentoController : ControllerBase
    {
        private readonly IFinanciamentoService _financiamentoService;
        private readonly IParametrosFinanceirosRepository _parametrosRepo;

        public FinanciamentoController(
            IFinanciamentoService financiamentoService,
            IParametrosFinanceirosRepository parametrosRepo)
        {
            _financiamentoService = financiamentoService;
            _parametrosRepo = parametrosRepo;
        }

        [HttpPost("simular")]
        public IActionResult Simular([FromBody] SimularRequest request)
        {
            if (request.ValorFinanciado <= 0 || request.PrazoMeses <= 0 || request.TaxaAnual < 0)
                return BadRequest("Parâmetros de simulação inválidos. ValorFinanciado e PrazoMeses devem ser > 0, TaxaAnual deve ser >= 0.");

            var resultado = _financiamentoService.CompararSistemas(request.ValorFinanciado, request.TaxaAnual, request.PrazoMeses);
            return Ok(resultado);
        }

        [HttpPost("cet")]
        public IActionResult CalcularCET([FromBody] CetRequest request)
        {
            if (request.ValorFinanciado <= 0 || request.PrazoMeses <= 0 || request.TaxaAnual < 0
                || request.TaxaMip < 0 || request.TaxaDfi < 0 || request.TaxaAdmin < 0)
                return BadRequest("Parâmetros de CET inválidos. ValorFinanciado e PrazoMeses devem ser > 0, taxas devem ser >= 0.");

            var cet = _financiamentoService.CalcularCET(
                request.ValorFinanciado,
                request.TaxaAnual,
                request.PrazoMeses,
                request.TaxaMip,
                request.TaxaDfi,
                request.TaxaAdmin
            );
            return Ok(new { CetEstimadoAnual = cet });
        }

        [HttpPost("fgts")]
        public IActionResult SimularFGTS([FromBody] FgtsRequest request)
        {
            var resultado = _financiamentoService.SimularFGTS(
                request.SaldoDevedor,
                request.SaldoFgts,
                request.Modalidade,
                request.ParcelaAtual,
                request.PrazoRestante
            );
            return Ok(resultado);
        }

        [HttpGet("bancos")]
        public async Task<IActionResult> GetBancos()
        {
            var parametros = await _parametrosRepo.GetAtivoAsync();
            return Ok(parametros.BancosFinanciamento);
        }

        [HttpPost("comprometimento")]
        public async Task<IActionResult> Comprometimento([FromBody] ComprometimentoRequest request)
        {
            var parametros = await _parametrosRepo.GetAtivoAsync();
            var ok = _financiamentoService.VerificarComprometimentoRenda(request.RendaBrutaFamiliar, request.ParcelaCalculada);
            var limite = request.RendaBrutaFamiliar * parametros.LimiteComprometimentoRenda;
            return Ok(new
            {
                Aprovado = ok,
                ParcelaMaximaPermitida = limite,
                Diferenca = request.ParcelaCalculada - limite
            });
        }
    }

    public class SimularRequest
    {
        public decimal ValorFinanciado { get; set; }
        public decimal TaxaAnual { get; set; }
        public int PrazoMeses { get; set; }
    }

    public class CetRequest : SimularRequest
    {
        public decimal TaxaMip { get; set; }
        public decimal TaxaDfi { get; set; }
        public decimal TaxaAdmin { get; set; }
    }

    public class FgtsRequest
    {
        public decimal SaldoDevedor { get; set; }
        public decimal SaldoFgts { get; set; }
        public int Modalidade { get; set; }
        public decimal ParcelaAtual { get; set; }
        public int PrazoRestante { get; set; }
    }

    public class ComprometimentoRequest
    {
        public decimal RendaBrutaFamiliar { get; set; }
        public decimal ParcelaCalculada { get; set; }
    }
}
