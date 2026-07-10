using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class PlanoDraftDto
    {
        public string? Id { get; set; }
        public string? SessionId { get; set; }
        public string? UsuarioId { get; set; }

        public ObjetivoDraftDto? Objetivo { get; set; }
        public List<PessoaDraftDto> Pessoas { get; set; } = new();
        public BancoDraftDto? BancoEscolhido { get; set; }
        public List<AporteExtraDraftDto> AportesExtras { get; set; } = new();

        // Monthly tracking data
        public Dictionary<int, decimal> AportesRegularesEditados { get; set; } = new();
        /// <summary>
        /// Per-person aporte edits. Key = pessoaId, Value = Dictionary&lt;mes, valorEditado&gt;.
        /// </summary>
        public Dictionary<string, Dictionary<int, decimal>> AportesRegularesEditadosPorPessoa { get; set; } = new();
        public List<int> MesesConcluidos { get; set; } = new();
    }

    /// <summary>
    /// Matches the frontend SimInput / objetivo shape exactly (camelCase via JSON).
    /// </summary>
    public class ObjetivoDraftDto
    {
        public decimal ValorImovel { get; set; }
        public decimal PercentualEntrada { get; set; }
        public decimal PercentualCustosExtras { get; set; }
        public decimal ValorJaGuardado { get; set; }
        public decimal TaxaCdiAnual { get; set; }
        public decimal PercentualCdi { get; set; }
        public int PrazoMaxMeses { get; set; }
        public string? DataInicio { get; set; } // ISO string from frontend
        public string? NomePlano { get; set; }
        public string? TipoInvestimento { get; set; }
        public string? Estado { get; set; } // UF ex: "SP"
        public string? Cidade { get; set; } // Cidade ex: "São Paulo"
    }

    public class PessoaDraftDto
    {
        public string? Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public decimal Renda_mensal { get; set; }
        public decimal Renda_complementar { get; set; }
        public decimal Gastos_mensais { get; set; }
        public bool Usar_gastos_detalhados { get; set; }
        public List<GastoDetalhadoDraftDto> Gastos_detalhados { get; set; } = new();
        public decimal Aporte_mensal { get; set; }

        /// <summary>
        /// Valor inicial da pessoa (saldo guardado). Mapeado para SaldoInicial no backend.
        /// </summary>
        public decimal ValorInicial { get; set; }

        /// <summary>
        /// Tipo de investimento escolhido para o saldo desta pessoa. Ex: "poupanca", "cdb_100".
        /// </summary>
        public string? TipoInvestimento { get; set; }
    }

    public class GastoDetalhadoDraftDto
    {
        public string? Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public decimal Valor { get; set; }

        /// <summary>
        /// Categoria do gasto. Ex: "Moradia", "Alimentação", "Transporte".
        /// </summary>
        public string Categoria { get; set; } = string.Empty;
    }

    public class BancoDraftDto
    {
        public string? Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public decimal Taxa { get; set; }
    }

    public class AporteExtraDraftDto
    {
        public string? Data { get; set; } // ISO date string
        public decimal Valor { get; set; }
        public string Origem { get; set; } = string.Empty;
        public string? PessoaNome { get; set; }
        public string? PessoaId { get; set; }
    }
}
