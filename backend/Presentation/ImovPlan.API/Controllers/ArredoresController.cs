using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ArredoresController : ControllerBase
    {
        private readonly IPontoInteresseService _pontoInteresseService;

        public ArredoresController(IPontoInteresseService pontoInteresseService)
        {
            _pontoInteresseService = pontoInteresseService;
        }

        [HttpGet("pontos-interesse")]
        public async Task<ActionResult<IEnumerable<PontoInteresse>>> GetPontosInteresse(
            [FromQuery] double lat,
            [FromQuery] double lng,
            [FromQuery] double raio = 2000,
            [FromQuery] string categorias = "mercado,farmacia,escola,padaria,parque,hospital")
        {
            if (lat == 0 || lng == 0)
            {
                return BadRequest("Latitude e Longitude são obrigatórios.");
            }

            if (raio > 5000)
            {
                return BadRequest("O raio máximo permitido é 5000 metros.");
            }

            var cats = categorias.Split(',', System.StringSplitOptions.RemoveEmptyEntries);
            var resultados = await _pontoInteresseService.BuscarPontosInteresseAsync(lat, lng, raio, cats);

            return Ok(resultados);
        }

        [HttpPost("avaliar-regiao")]
        [EnableRateLimiting("ia")]
        public async Task<ActionResult<string>> AvaliarRegiao(
            [FromServices] IAiConsultingService aiService,
            [FromBody] ImovPlan.Application.DTOs.AvaliacaoRegiaoRequestDto dto)
        {
            var prompt = $@"Você é um consultor imobiliário especialista no Brasil.
Eu estou analisando uma rua para possivelmente comprar uma casa ou apartamento. Num raio de 2km, encontrei:
- {dto.QuantidadeMercados} mercados
- {dto.QuantidadeFarmacias} farmácias
- {dto.QuantidadeEscolas} escolas
- {dto.QuantidadeHospitais} hospitais/clínicas
- {dto.QuantidadeParques} parques

Alguns dos principais locais encontrados são: {string.Join(", ", dto.PrincipaisLocais)}.

Com base nisso, escreva uma avaliação rápida (em 1 parágrafo animado e direto) sobre a infraestrutura e conveniência dessa região para um casal morar. Destaque se é bem servida ou se falta algo.";

            var respostaAi = await aiService.GetAvaliacaoRegiaoAsync(prompt);
            return Ok(new { avaliacao = respostaAi });
        }
    }
}
