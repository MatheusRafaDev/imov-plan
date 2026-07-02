using System;
using System.Linq;
using System.Text.Json;
using ImovPlan.Application.Services;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using Moq;
using Xunit;

namespace ImovPlan.Application.Tests
{
    public class FinanciamentoServiceTests
    {
        private readonly FinanciamentoService _service;
        private readonly Mock<IParametrosFinanceirosRepository> _parametrosRepoMock;

        public FinanciamentoServiceTests()
        {
            _parametrosRepoMock = new Mock<IParametrosFinanceirosRepository>();
            // Setup mock para não quebrar se for chamado
            _parametrosRepoMock.Setup(repo => repo.GetAtivoAsync())
                .ReturnsAsync(new ParametrosFinanceiros());

            _service = new FinanciamentoService(_parametrosRepoMock.Object);
        }

        [Fact]
        public void SimularSAC_DeveRetornarSomaAmortizacoesIgualPV_EZerarSaldoNoFinal()
        {
            decimal pv = 300000m;
            decimal taxaAnual = 10.5m;
            int prazo = 360;

            var resultado = _service.SimularSAC(pv, taxaAnual, prazo);

            // Serializa e converte para JsonDocument para testar objeto anônimo
            var json = JsonSerializer.Serialize(resultado);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.Equal("SAC", root.GetProperty("Sistema").GetString());

            var parcelas = root.GetProperty("Parcelas").EnumerateArray().ToList();
            Assert.Equal(360, parcelas.Count);

            decimal somaAmortizacao = 0;
            foreach (var p in parcelas)
            {
                somaAmortizacao += p.GetProperty("Amortizacao").GetDecimal();
            }

            // Pode ter pequena diferença de arredondamento na soma total de amortização (ex: 833.33 * 360 = 299998.80)
            // No código original a amortizacaoFixa é inserida no array com Math.Round.
            // Para SAC exato de 300000 / 360, 833.33 * 360 = 299998.8. Aceitando erro < 2
            Assert.True(Math.Abs(pv - somaAmortizacao) < 2m, "Soma das amortizações difere muito do PV (arredondamento esperado)");

            var ultimaParcela = parcelas.Last();
            Assert.Equal(0m, ultimaParcela.GetProperty("SaldoDevedor").GetDecimal());
            Assert.Equal(360, ultimaParcela.GetProperty("Mes").GetInt32());
        }

        [Fact]
        public void SimularPrice_DeveRetornarSomaAmortizacoesIgualPV_EZerarSaldoNoFinal()
        {
            decimal pv = 300000m;
            decimal taxaAnual = 10.5m;
            int prazo = 360;

            var resultado = _service.SimularPrice(pv, taxaAnual, prazo);

            var json = JsonSerializer.Serialize(resultado);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            Assert.Equal("PRICE", root.GetProperty("Sistema").GetString());

            var parcelas = root.GetProperty("Parcelas").EnumerateArray().ToList();
            Assert.Equal(360, parcelas.Count);

            decimal somaAmortizacao = 0;
            foreach (var p in parcelas)
            {
                somaAmortizacao += p.GetProperty("Amortizacao").GetDecimal();
            }

            Assert.True(Math.Abs(pv - somaAmortizacao) < 2m, "Soma das amortizações difere muito do PV");

            var ultimaParcela = parcelas.Last();
            Assert.Equal(0m, ultimaParcela.GetProperty("SaldoDevedor").GetDecimal());
            Assert.Equal(360, ultimaParcela.GetProperty("Mes").GetInt32());
        }

        [Fact]
        public void SimularSAC_DeveBaterComCasoConhecido()
        {
            // PV = 300.000, 10.5% aa (~0.8355% am), 360 meses
            // Taxa mensal = (1 + 0.105)^(1/12) - 1 = 0.008355...
            decimal pv = 300000m;
            decimal taxaAnual = 10.5m;
            int prazo = 360;

            var taxaMensal = (decimal)Math.Pow((double)(1 + (taxaAnual / 100m)), 1.0 / 12.0) - 1;

            var resultado = _service.SimularSAC(pv, taxaAnual, prazo);
            var json = JsonSerializer.Serialize(resultado);
            using var doc = JsonDocument.Parse(json);
            var parcelas = doc.RootElement.GetProperty("Parcelas").EnumerateArray().ToList();

            var p1 = parcelas.First();
            var amortizacaoP1 = p1.GetProperty("Amortizacao").GetDecimal();
            var jurosP1 = p1.GetProperty("Juros").GetDecimal();
            var parcelaP1 = p1.GetProperty("Parcela").GetDecimal();
            var saldoDevedorP1 = p1.GetProperty("SaldoDevedor").GetDecimal();

            var amortizacaoEsperada = Math.Round(pv / prazo, 2);
            var jurosEsperado = Math.Round(pv * taxaMensal, 2);
            var parcelaEsperada = Math.Round(amortizacaoEsperada + (pv * taxaMensal), 2);
            var saldoEsperado = Math.Round(pv - (pv / prazo), 2);

            Assert.Equal(amortizacaoEsperada, amortizacaoP1);
            Assert.Equal(jurosEsperado, jurosP1);
            Assert.Equal(parcelaEsperada, parcelaP1);
            Assert.Equal(saldoEsperado, saldoDevedorP1);
        }
    }
}
