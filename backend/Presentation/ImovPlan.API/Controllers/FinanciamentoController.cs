using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.Application.Services.Interfaces;
using System.Collections.Generic;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FinanciamentoController : ControllerBase
    {
        private readonly IFinanciamentoService _financiamentoService;

        public FinanciamentoController(IFinanciamentoService financiamentoService)
        {
            _financiamentoService = financiamentoService;
        }

        [HttpPost("simular")]
        public IActionResult Simular([FromBody] SimularRequest request)
        {
            var resultado = _financiamentoService.CompararSistemas(request.ValorFinanciado, request.TaxaAnual, request.PrazoMeses);
            return Ok(resultado);
        }

        [HttpPost("cet")]
        public IActionResult CalcularCET([FromBody] CetRequest request)
        {
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
        public IActionResult GetBancos()
        {
            var bancos = new List<object>
            {
                new { Nome = "Caixa Econômica Federal", TaxaBaseAproximada = 11.19m },
                new { Nome = "BRB", TaxaBaseAproximada = 11.36m },
                new { Nome = "Itaú Unibanco", TaxaBaseAproximada = 11.60m },
                new { Nome = "Banco do Brasil", TaxaBaseAproximada = 11.60m },
                new { Nome = "Santander", TaxaBaseAproximada = 11.69m },
                new { Nome = "Bradesco", TaxaBaseAproximada = 11.70m }
            };
            return Ok(bancos);
        }

        [HttpPost("comprometimento")]
        public IActionResult Comprometimento([FromBody] ComprometimentoRequest request)
        {
            var ok = _financiamentoService.VerificarComprometimentoRenda(request.RendaBrutaFamiliar, request.ParcelaCalculada);
            var limite = request.RendaBrutaFamiliar * 0.30m;
            return Ok(new { 
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
