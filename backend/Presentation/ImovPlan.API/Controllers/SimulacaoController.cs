using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ImovPlan.API.Extensions;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SimulacaoController : ControllerBase
    {
        private readonly ISimulacaoService _simulacaoService;
        private readonly IPlanejamentoRepository _planejamentoRepository;
        private readonly IHistoricoSimulacaoRepository _historicoRepository;

        public SimulacaoController(
            ISimulacaoService simulacaoService,
            IPlanejamentoRepository planejamentoRepository,
            IHistoricoSimulacaoRepository historicoRepository)
        {
            _simulacaoService = simulacaoService;
            _planejamentoRepository = planejamentoRepository;
            _historicoRepository = historicoRepository;
        }

        /// <summary>
        /// GET /api/simulacao/{planoId}/ultima — Retorna a última simulação salva no banco com evolução mensal
        /// </summary>
        [HttpGet("{planoId}/ultima")]
        public async Task<IActionResult> GetUltimaSimulacao(string planoId)
        {
            var usuarioId = User.GetUsuarioId();
            if (string.IsNullOrEmpty(usuarioId))
                return Unauthorized(new { message = "Não autorizado." });

            var planejamento = await _planejamentoRepository.GetByIdAsync(planoId);
            if (planejamento == null || planejamento.UsuarioId != usuarioId)
                return NotFound(new { message = "Planejamento não encontrado" });

            var ultimoRegistro = await _historicoRepository.GetUltimoByPlanejamentoIdAsync(planoId);
            if (ultimoRegistro == null)
                return NotFound(new { message = "Nenhuma simulação encontrada para este plano" });

            var evolucao = await _historicoRepository.GetEvolucaoBySimulacaoIdAsync(ultimoRegistro.Id);

            var result = MapToDto(ultimoRegistro, evolucao);
            return Ok(result);
        }

        /// <summary>
        /// POST /api/simulacao/{planoId}/calcular — Recalcula do zero e retorna + salva
        /// </summary>
        [HttpPost("{planoId}/calcular")]
        public async Task<IActionResult> CalcularSimulacao(string planoId, [FromBody] SimulacaoRequestDto request)
        {
            var usuarioId = User.GetUsuarioId();
            var planejamento = await _planejamentoRepository.GetByIdAsync(planoId);
            if (planejamento == null || string.IsNullOrEmpty(usuarioId) || planejamento.UsuarioId != usuarioId)
                return NotFound(new { message = "Planejamento não encontrado" });

            var totalNecessario = planejamento.CustosCompra?.TotalNecessario ?? 0m;

            var resultado = await _simulacaoService.ExecutarSimulacaoAsync(
                request,
                planejamento,
                totalNecessario,
                origem: "manual");

            // Buscar o registro completo que foi salvo
            var ultimoRegistro = await _historicoRepository.GetUltimoByPlanejamentoIdAsync(planoId);
            if (ultimoRegistro == null)
                return StatusCode(500, new { message = "Erro ao salvar simulação" });

            var evolucao = await _historicoRepository.GetEvolucaoBySimulacaoIdAsync(ultimoRegistro.Id);
            var result = MapToDto(ultimoRegistro, evolucao);

            return Ok(result);
        }

        private static SimulacaoResultDto MapToDto(HistoricoSimulacao h, IEnumerable<EvolucaoMensalSimulacao> evolucao)
        {
            return new SimulacaoResultDto
            {
                Id = h.Id,
                PlanejamentoId = h.PlanejamentoId,
                GeradoEm = h.GeradoEm,
                Origem = h.Origem,
                Versao = h.Versao,
                ValorImovel = h.ValorImovel,
                TotalNecessario = h.TotalNecessario,
                ValorJaGuardado = h.ValorJaGuardado,
                AporteMensalTotal = h.AporteMensalTotal,
                TaxaCdiAnual = h.TaxaCdiAnual,
                PercentualCdi = h.PercentualCdi,
                MesesParaAtingir = h.MesesParaAtingir,
                DataPrevistaAlvo = h.DataPrevistaAlvo,
                TotalInvestido = h.TotalInvestido,
                TotalAcumulado = h.TotalAcumulado,
                LucroLiquido = h.LucroLiquido,
                AtingiuMeta = h.AtingiuMeta,
                Falta = h.Falta,
                DetalhesMensais = evolucao.Select(e => new DetalheMensalDto
                {
                    Mes = e.Mes,
                    DataReferencia = e.DataReferencia,
                    AporteMensal = e.AporteMensal,
                    AportesExtras = e.AportesExtras,
                    RendimentoBruto = e.RendimentoBruto,
                    Imposto = e.Imposto,
                    RendimentoLiquido = e.RendimentoLiquido,
                    TotalAcumulado = e.TotalAcumulado,
                }).ToList(),
                ParticipantesSnapshot = h.ParticipantesSnapshot.Select(p => new ParticipanteSnapshotDto
                {
                    ParticipanteId = p.ParticipanteId,
                    Nome = p.Nome,
                    AporteMensal = p.AporteMensal,
                    ValorInicial = p.ValorInicial,
                    SobraMensal = p.SobraMensal,
                }).ToList(),
            };
        }
    }
}
