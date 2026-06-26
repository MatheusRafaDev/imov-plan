using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ImovPlan.Domain.Enums;

namespace ImovPlan.Domain.Entities
{
    public class Participante
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("planejamentoId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string PlanejamentoId { get; set; } = string.Empty;

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("rendaMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal RendaMensal { get; set; }

        [BsonElement("rendaComplementar")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal RendaComplementar { get; set; }

        [BsonElement("gastosMensais")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal GastosMensais { get; set; }

        [BsonElement("usarGastosDetalhados")]
        public bool UsarGastosDetalhados { get; set; }

        [BsonElement("sobraMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal SobraMensal { get; set; }

        [BsonElement("aporteMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AporteMensal { get; set; }

        [BsonElement("patrimonioInicial")]
        public PatrimonioInicial? PatrimonioInicial { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PatrimonioInicial
    {
        [BsonElement("valor")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Valor { get; set; }

        [BsonElement("fonte")]
        [BsonRepresentation(BsonType.String)]
        public FonteSaldo Fonte { get; set; } = FonteSaldo.Poupanca;

        [BsonElement("tipoInvestimento")]
        public string? TipoInvestimento { get; set; }

        [BsonElement("registradoEm")]
        public DateTime RegistradoEm { get; set; } = DateTime.UtcNow;
    }
}
