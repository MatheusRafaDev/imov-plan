using System.Collections.Generic;
using ImovPlan.Application.Services;
using ImovPlan.Domain.Entities;
using Xunit;

namespace ImovPlan.Application.Tests
{
    public class CalculoFinanceiroServiceTests
    {
        private readonly CalculoFinanceiroService _service;

        public CalculoFinanceiroServiceTests()
        {
            _service = new CalculoFinanceiroService();
        }

        [Fact]
        public void CalcularEntrada_DeveCalcularPercentualCorretamente()
        {
            var entrada = _service.CalcularEntrada(300000m, 20m);
            Assert.Equal(60000m, entrada);
        }

        [Fact]
        public void CalcularDiagnostico_ZeroParticipantes_SobraZero()
        {
            var participantes = new List<Participante>();
            var resultado = _service.CalcularDiagnostico(participantes, 10000m, 0m);

            Assert.Equal(0m, resultado.SobraPessoa1);
            Assert.Equal(0m, resultado.SobraPessoa2);
            Assert.Equal(0m, resultado.SobraCasal);
            Assert.Equal(10000m, resultado.ValorFaltante);
        }

        [Fact]
        public void CalcularDiagnostico_UmParticipante_PreencheSobraPessoa1()
        {
            var participantes = new List<Participante>
            {
                new Participante { SobraMensal = 1500m }
            };
            var resultado = _service.CalcularDiagnostico(participantes, 10000m, 0m);

            Assert.Equal(1500m, resultado.SobraPessoa1);
            Assert.Equal(0m, resultado.SobraPessoa2);
            Assert.Equal(1500m, resultado.SobraCasal);
            Assert.Equal(10000m, resultado.ValorFaltante);
        }

        [Fact]
        public void CalcularDiagnostico_DoisParticipantes_PreencheSobraAmbos()
        {
            var participantes = new List<Participante>
            {
                new Participante { SobraMensal = 1500m },
                new Participante { SobraMensal = 2000m }
            };
            var resultado = _service.CalcularDiagnostico(participantes, 10000m, 0m);

            Assert.Equal(1500m, resultado.SobraPessoa1);
            Assert.Equal(2000m, resultado.SobraPessoa2);
            Assert.Equal(3500m, resultado.SobraCasal);
        }

        [Fact]
        public void CalcularDiagnostico_FaltaNegativa_DeveVirarZero()
        {
            var participantes = new List<Participante>();
            var resultado = _service.CalcularDiagnostico(participantes, 5000m, 6000m);

            Assert.Equal(0m, resultado.ValorFaltante);
        }
    }
}
