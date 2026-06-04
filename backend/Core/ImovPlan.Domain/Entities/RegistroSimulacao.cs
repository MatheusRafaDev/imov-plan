using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    /// <summary>
    /// Registro imutável de uma simulação executada, persistido ao final de cada cálculo.
    /// Armazena inputs e outputs para histórico e recuperação.
    /// </summary>
    public class RegistroSimulacao
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("objetivoImovelId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjetivoImovelId { get; set; } = string.Empty;

        [BsonElement("geradoEm")]
        public DateTime GeradoEm { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// "auto" | "manual" | "step_concluido"
        /// </summary>
        [BsonElement("origem")]
        public string Origem { get; set; } = "auto";

        [BsonElement("stepAtual")]
        public int StepAtual { get; set; }

        [BsonElement("versao")]
        public int Versao { get; set; }

        // ── Inputs (snapshot do momento do cálculo) ──

        [BsonElement("valorImovel")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorImovel { get; set; }

        [BsonElement("totalNecessario")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalNecessario { get; set; }

        [BsonElement("valorJaGuardado")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorJaGuardado { get; set; }

        [BsonElement("aporteMensalTotal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AporteMensalTotal { get; set; }

        [BsonElement("taxaCdiAnual")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaCdiAnual { get; set; }

        [BsonElement("percentualCdi")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualCdi { get; set; }

        // ── Outputs ──

        [BsonElement("mesesParaAtingir")]
        public int MesesParaAtingir { get; set; }

        [BsonElement("dataPrevistaAlvo")]
        public DateTime DataPrevistaAlvo { get; set; }

        [BsonElement("totalInvestido")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalInvestido { get; set; }

        [BsonElement("totalAcumulado")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalAcumulado { get; set; }

        [BsonElement("lucroLiquido")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal LucroLiquido { get; set; }

        [BsonElement("atingiuMeta")]
        public bool AtingiuMeta { get; set; }

        [BsonElement("falta")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Falta { get; set; }

        // ── Listas embedded ──

        [BsonElement("pessoasSnapshot")]
        public List<PessoaSnapshot> PessoasSnapshot { get; set; } = new();

        [BsonElement("detalhesMensais")]
        public List<DetalheMensal> DetalhesMensais { get; set; } = new();

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Snapshot dos dados de uma pessoa no momento da simulação.
    /// </summary>
    public class PessoaSnapshot
    {
        [BsonElement("pessoaId")]
        public string PessoaId { get; set; } = string.Empty;

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("aporteMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AporteMensal { get; set; }

        [BsonElement("valorInicial")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorInicial { get; set; }

        [BsonElement("sobraMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal SobraMensal { get; set; }
    }
}
