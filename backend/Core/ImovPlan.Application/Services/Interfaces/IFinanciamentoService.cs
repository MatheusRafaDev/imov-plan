using ImovPlan.Application.DTOs;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IFinanciamentoService
    {
        object SimularSAC(decimal pv, decimal taxaAnual, int prazoMeses);
        object SimularPrice(decimal pv, decimal taxaAnual, int prazoMeses);
        object CompararSistemas(decimal pv, decimal taxaAnual, int prazoMeses);
        decimal CalcularCET(decimal pv, decimal taxaAnual, int prazoMeses, decimal taxaMip, decimal taxaDfi, decimal taxaAdmin);
        bool VerificarComprometimentoRenda(decimal rendaBrutaFamiliar, decimal parcelaCalculada);
        object SimularFGTS(decimal saldoDevedor, decimal saldoFgts, int modalidade, decimal parcelaAtual, int prazoRestante);
        SimResultDto Simular(SimInputDto input);
    }
}
