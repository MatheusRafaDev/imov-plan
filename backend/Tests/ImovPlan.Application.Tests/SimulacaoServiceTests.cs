using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using Moq;
using Xunit;

namespace ImovPlan.Application.Tests
{
    public class SimulacaoServiceTests
    {
        private readonly SimulacaoService _service;
        private readonly Mock<IHistoricoSimulacaoRepository> _historicoRepoMock;
        private readonly Mock<IParticipanteRepository> _participanteRepoMock;
        private readonly Mock<IParametrosFinanceirosRepository> _parametrosRepoMock;

        public SimulacaoServiceTests()
        {
            _historicoRepoMock = new Mock<IHistoricoSimulacaoRepository>();
            _participanteRepoMock = new Mock<IParticipanteRepository>();
            _parametrosRepoMock = new Mock<IParametrosFinanceirosRepository>();

            var parametros = new ParametrosFinanceiros
            {
                PrazoFinanciamentoPadraoMeses = 360,
                PercentualCdiPadrao = 100m,
                AliquotasIr = new List<AliquotaIrParametro>
                {
                    new AliquotaIrParametro { AteDias = null, Aliquota = 0.15m }
                }
            };
            _parametrosRepoMock.Setup(r => r.GetAtivoAsync()).ReturnsAsync(parametros);

            _historicoRepoMock.Setup(r => r.GetAllByPlanejamentoIdAsync(It.IsAny<string>()))
                .ReturnsAsync(new List<HistoricoSimulacao>());

            _service = new SimulacaoService(
                _historicoRepoMock.Object,
                _participanteRepoMock.Object,
                _parametrosRepoMock.Object
            );
        }

        private SimulacaoRequestDto CreateRequest(decimal aporte)
        {
            return new SimulacaoRequestDto
            {
                PercentualCdi = 100,
                TaxaCDI = 10,
                AportesMensais = new List<AporteMensalDto> { new AporteMensalDto { Valor = aporte, PessoaId = "p1" } },
                AportesExtras = new List<AporteExtraDto>()
            };
        }

        [Fact]
        public async Task ExecutarSimulacao_PrazoMaxMesesDefinidoEMaiorQueZero_DeveRespeitarOLimite()
        {
            // Arrange
            var planejamento = new Planejamento
            {
                Id = "plan1",
                PrazoMaxMeses = 24, // Limite explícito
                ParticipantesIds = new List<string>(),
                DataInicio = new DateTime(2025, 1, 1)
            };
            // Meta inatingível com esses valores (aporte 0)
            var request = CreateRequest(0);

            // Act
            var resultado = await _service.ExecutarSimulacaoAsync(request, planejamento, 1000000m);

            // Assert
            // Como nunca atingirá a meta de 1.000.000, deve rodar exatamente até o PrazoMaxMeses definido (24)
            Assert.Equal(24, resultado.MesesParaAtingir); // MesesParaAtingir fallback é o total de meses rodados
            Assert.Equal(25, resultado.DetalhesMensais.Count);
        }

        [Fact]
        public async Task ExecutarSimulacao_PrazoMaxMesesNullOuZero_DeveUsarFallbackDosParametros()
        {
            // Arrange
            var planejamento = new Planejamento
            {
                Id = "plan1",
                PrazoMaxMeses = null,
                ParticipantesIds = new List<string>(),
                DataInicio = new DateTime(2025, 1, 1)
            };
            var request = CreateRequest(0); // Aporte 0 não atinge meta

            // Act
            var resultado = await _service.ExecutarSimulacaoAsync(request, planejamento, 1000000m);

            // Assert
            // O fallback em ParametrosFinanceiros.PrazoFinanciamentoPadraoMeses é 360 (definido no setup)
            Assert.Equal(361, resultado.DetalhesMensais.Count);
            Assert.Equal(360, resultado.MesesParaAtingir);
        }

        [Fact]
        public async Task ExecutarSimulacao_AtingeMetaAntesDoLimite_DeveSimularMais6Meses()
        {
            // Arrange
            var planejamento = new Planejamento
            {
                Id = "plan1",
                PrazoMaxMeses = 120,
                ParticipantesIds = new List<string>(),
                DataInicio = new DateTime(2025, 1, 1)
            };
            // Aporte alto para atingir a meta rápido
            var request = CreateRequest(50000m);
            decimal totalNecessario = 200000m; 
            // 50k por mês atinge em cerca de 4 meses

            // Act
            var resultado = await _service.ExecutarSimulacaoAsync(request, planejamento, totalNecessario);

            // Assert
            // MesesParaAtingir deve ser o mês exato (4 meses)
            Assert.Equal(4, resultado.MesesParaAtingir);

            // O total de detalhes (meses simulados) deve ser MesesParaAtingir + 6 = 10 (mais mês 0 = 11)
            Assert.Equal(11, resultado.DetalhesMensais.Count);
            
            // Verifica o AtingiuMeta passado pro repositório, mas como aqui temos o DTO podemos testar saldo >= totalNecessario
            Assert.True(resultado.TotalAcumulado >= totalNecessario);
        }
    }
}
