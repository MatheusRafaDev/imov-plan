using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using Moq;
using Xunit;

namespace ImovPlan.Application.Tests
{
    public class SimulacaoParidadeTests
    {
        private readonly SimulacaoService _service;
        private readonly Mock<IHistoricoSimulacaoRepository> _historicoRepoMock;
        private readonly Mock<IParticipanteRepository> _participanteRepoMock;
        private readonly Mock<IParametrosFinanceirosRepository> _parametrosRepoMock;

        public SimulacaoParidadeTests()
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
                    new AliquotaIrParametro { AteDias = 180, Aliquota = 0.225m },
                    new AliquotaIrParametro { AteDias = 360, Aliquota = 0.20m },
                    new AliquotaIrParametro { AteDias = 720, Aliquota = 0.175m },
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

        [Fact]
        public async Task ExecutarSimulacao_DeveTerParidadeComFrontend()
        {
            // O binário roda em /backend/Tests/ImovPlan.Application.Tests/bin/Debug/net...
            // Subimos na árvore de diretórios até a raiz do repositório
            var basePath = AppContext.BaseDirectory;
            var repoRoot = Path.GetFullPath(Path.Combine(basePath, "..", "..", "..", "..", "..", ".."));
            var fixturePath = Path.Combine(repoRoot, "frontend", "tests", "fixtures", "casos-paridade.json");

            if (!File.Exists(fixturePath))
            {
                // Fallback ou aviso se rodado de outro diretório (ex: no CI)
                // Dependendo de onde se roda o `dotnet test`, o caminho relativo pode variar, mas AppContext.BaseDirectory é mais seguro.
                Assert.Fail($"Arquivo de fixture não encontrado: {fixturePath}");
            }

            var json = File.ReadAllText(fixturePath);
            var cenarios = JsonSerializer.Deserialize<List<CenarioParidade>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(cenarios);
            Assert.NotEmpty(cenarios);

            foreach (var cenario in cenarios)
            {
                // Setup mock do participante para o ValorJaGuardado
                // No backend, ValorJaGuardado é somado a partir dos participantes. 
                var participanteId = "p1";
                _participanteRepoMock.Setup(r => r.GetByIdAsync(participanteId))
                    .ReturnsAsync(new Participante { Id = participanteId, PatrimonioInicial = new PatrimonioInicial { Valor = cenario.Input.ValorJaGuardado } });

                var planejamento = new Planejamento
                {
                    Id = "plan_" + cenario.Name,
                    PrazoMaxMeses = cenario.Input.PrazoMaxMeses,
                    ParticipantesIds = new List<string> { participanteId },
                    DataInicio = DateTime.Parse(cenario.Input.DataInicio),
                    TaxaCdiAnual = cenario.Input.TaxaCdiAnual,
                    PercentualCdi = cenario.Input.PercentualCdi,
                    ValorImovel = cenario.Input.ValorImovel
                };

                var request = new SimulacaoRequestDto
                {
                    TaxaCDI = cenario.Input.TaxaCdiAnual,
                    PercentualCdi = cenario.Input.PercentualCdi,
                    AportesMensais = new List<AporteMensalDto>
                    {
                        new AporteMensalDto { PessoaId = participanteId, Valor = cenario.Input.AporteMensalTotal }
                    },
                    AportesExtras = cenario.Input.AportesExtras.Select(a => new AporteExtraDto
                    {
                        Data = DateTime.Parse(a.Data),
                        Valor = a.Valor
                    }).ToList()
                };

                var totalNecessario = (cenario.Input.ValorImovel * (cenario.Input.PercentualEntrada / 100m)) 
                                    + (cenario.Input.ValorImovel * (cenario.Input.PercentualCustosExtras / 100m));

                // Act
                var resultado = await _service.ExecutarSimulacaoAsync(request, planejamento, totalNecessario);

                // Assert with tolerance (0.05m para cobrir diferenças de arredondamento em float vs decimal)
                Assert.True(Math.Abs(cenario.Output.TotalInvestido - resultado.TotalInvestido) < 0.05m, $"{cenario.Name}: TotalInvestido divergiu. Esperado: {cenario.Output.TotalInvestido}, Obtido: {resultado.TotalInvestido}");
                Assert.True(Math.Abs(cenario.Output.SaldoFinal - resultado.TotalAcumulado) < 0.05m, $"{cenario.Name}: SaldoFinal divergiu. Esperado: {cenario.Output.SaldoFinal}, Obtido: {resultado.TotalAcumulado}");
                
                Assert.Equal(cenario.Output.AtingiuMeta, resultado.TotalAcumulado >= totalNecessario);
                
                if (cenario.Output.AtingiuMeta)
                {
                    Assert.Equal(cenario.Output.MesAtingiuMeta, resultado.MesesParaAtingir);
                }
            }
        }

        // Classes de DTO para ler o JSON de paridade
        private class CenarioParidade
        {
            public string Name { get; set; } = string.Empty;
            public InputParidade Input { get; set; } = new InputParidade();
            public OutputParidade Output { get; set; } = new OutputParidade();
        }

        private class InputParidade
        {
            public decimal ValorImovel { get; set; }
            public decimal PercentualEntrada { get; set; }
            public decimal PercentualCustosExtras { get; set; }
            public decimal ValorJaGuardado { get; set; }
            public decimal AporteMensalTotal { get; set; }
            public decimal TaxaCdiAnual { get; set; }
            public decimal PercentualCdi { get; set; }
            public List<AporteParidade> AportesExtras { get; set; } = new List<AporteParidade>();
            public int PrazoMaxMeses { get; set; }
            public string DataInicio { get; set; } = string.Empty;
        }

        private class AporteParidade
        {
            public string Data { get; set; } = string.Empty;
            public decimal Valor { get; set; }
        }

        private class OutputParidade
        {
            public decimal Meta { get; set; }
            public bool AtingiuMeta { get; set; }
            public int? MesAtingiuMeta { get; set; }
            public decimal SaldoFinal { get; set; }
            public decimal TotalInvestido { get; set; }
        }
    }
}
