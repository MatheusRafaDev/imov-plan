using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class ParametrosFinanceiros
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("codigo")]
        public string Codigo { get; set; } = "default";

        [BsonElement("descricao")]
        public string Descricao { get; set; } = "Parâmetros financeiros padrão";

        [BsonElement("ativo")]
        public bool Ativo { get; set; } = true;

        [BsonElement("taxaCdiAnualPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaCdiAnualPadrao { get; set; } = 10.5m;

        [BsonElement("percentualCdiPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualCdiPadrao { get; set; } = 100m;

        [BsonElement("prazoMaxSimulacaoMeses")]
        public int PrazoMaxSimulacaoMeses { get; set; } = 600;

        [BsonElement("prazoFinanciamentoPadraoMeses")]
        public int PrazoFinanciamentoPadraoMeses { get; set; } = 360;

        [BsonElement("taxaFinanciamentoAnualPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaFinanciamentoAnualPadrao { get; set; } = 9.5m;

        [BsonElement("taxaMcmvAnualPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaMcmvAnualPadrao { get; set; } = 8.16m;

        [BsonElement("taxaSbpeAnualPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaSbpeAnualPadrao { get; set; } = 10.5m;

        [BsonElement("limiteComprometimentoRenda")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal LimiteComprometimentoRenda { get; set; } = 0.30m;

        [BsonElement("fgtsPercentualParcela")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal FgtsPercentualParcela { get; set; } = 0.80m;

        [BsonElement("custoItbiPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoItbiPadrao { get; set; } = 0.02m;

        [BsonElement("custoEscrituraPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoEscrituraPadrao { get; set; } = 0.01m;

        [BsonElement("custoRegistroPadrao")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoRegistroPadrao { get; set; } = 0.005m;

        [BsonElement("itbiIsencaoSp")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ItbiIsencaoSp { get; set; } = 335000m;

        [BsonElement("tetoSfh")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TetoSfh { get; set; } = 1500000m;

        [BsonElement("itbiCheio")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ItbiCheio { get; set; } = 0.03m;

        [BsonElement("itbiSfh")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ItbiSfh { get; set; } = 0.005m;

        [BsonElement("capCustosCompra")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CapCustosCompra { get; set; } = 0.04m;

        [BsonElement("investimentos")]
        public List<InvestimentoParametro> Investimentos { get; set; } = DefaultInvestimentos();

        [BsonElement("aliquotasIr")]
        public List<AliquotaIrParametro> AliquotasIr { get; set; } = DefaultAliquotasIr();

        [BsonElement("faixasCartorio")]
        public List<FaixaCartorioParametro> FaixasCartorio { get; set; } = DefaultFaixasCartorio();

        [BsonElement("bancosFinanciamento")]
        public List<BancoFinanciamentoParametro> BancosFinanciamento { get; set; } = DefaultBancosFinanciamento();

        [BsonElement("atualizadoEm")]
        public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

        public static ParametrosFinanceiros Default() => new();

        public static List<InvestimentoParametro> DefaultInvestimentos() => new()
        {
            new() { Tipo = "poupanca", Nome = "Poupança", PercentualCdi = 70m },
            new() { Tipo = "conta_corrente", Nome = "Conta Corrente", PercentualCdi = 25m },
            new() { Tipo = "cdb_100", Nome = "CDB / Renda Fixa", PercentualCdi = 100m },
            new() { Tipo = "cdb_120", Nome = "CDB 120% CDI", PercentualCdi = 120m },
            new() { Tipo = "tesouro_selic", Nome = "Tesouro Selic", PercentualCdi = 100m },
            new() { Tipo = "lci_lca", Nome = "LCI / LCA", PercentualCdi = 100m },
            new() { Tipo = "fundo_di", Nome = "Fundo DI", PercentualCdi = 100m },
            new() { Tipo = "fgts", Nome = "FGTS", PercentualCdi = 50m },
            new() { Tipo = "previdencia", Nome = "Previdência", PercentualCdi = 90m },
            new() { Tipo = "cripto", Nome = "Criptomoedas", PercentualCdi = 125m },
        };

        public static List<AliquotaIrParametro> DefaultAliquotasIr() => new()
        {
            new() { AteDias = 180, Aliquota = 0.225m },
            new() { AteDias = 360, Aliquota = 0.20m },
            new() { AteDias = 720, Aliquota = 0.175m },
            new() { AteDias = null, Aliquota = 0.15m },
        };

        public static List<FaixaCartorioParametro> DefaultFaixasCartorio() => new()
        {
            new() { AteValor = 100000m, ValorFixo = 1500m, Percentual = 0m },
            new() { AteValor = 300000m, ValorFixo = 0m, Percentual = 0.015m },
            new() { AteValor = 700000m, ValorFixo = 0m, Percentual = 0.013m },
            new() { AteValor = 1500000m, ValorFixo = 0m, Percentual = 0.011m },
            new() { AteValor = null, ValorFixo = 0m, Percentual = 0.009m },
        };

        public static List<BancoFinanciamentoParametro> DefaultBancosFinanciamento() => new()
        {
            new() { Nome = "Caixa Econômica Federal", TaxaBaseAproximada = 11.19m },
            new() { Nome = "BRB", TaxaBaseAproximada = 11.36m },
            new() { Nome = "Itaú Unibanco", TaxaBaseAproximada = 11.60m },
            new() { Nome = "Banco do Brasil", TaxaBaseAproximada = 11.60m },
            new() { Nome = "Santander", TaxaBaseAproximada = 11.69m },
            new() { Nome = "Bradesco", TaxaBaseAproximada = 11.70m },
        };
    }

    public class InvestimentoParametro
    {
        [BsonElement("tipo")]
        public string Tipo { get; set; } = string.Empty;

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("percentualCdi")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualCdi { get; set; }
    }

    public class AliquotaIrParametro
    {
        [BsonElement("ateDias")]
        public int? AteDias { get; set; }

        [BsonElement("aliquota")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Aliquota { get; set; }
    }

    public class FaixaCartorioParametro
    {
        [BsonElement("ateValor")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal? AteValor { get; set; }

        [BsonElement("valorFixo")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorFixo { get; set; }

        [BsonElement("percentual")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Percentual { get; set; }
    }

    public class BancoFinanciamentoParametro
    {
        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("taxaBaseAproximada")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaBaseAproximada { get; set; }
    }
}
