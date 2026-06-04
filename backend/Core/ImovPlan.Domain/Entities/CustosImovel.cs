using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class CustosImovel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("objetivoImovelId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjetivoImovelId { get; set; } = string.Empty;

        [BsonElement("valorEntrada")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorEntrada { get; set; }

        [BsonElement("totalNecessario")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalNecessario { get; set; }

        [BsonElement("percentualCustosExtras")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualCustosExtras { get; set; }

        [BsonElement("custoITBI")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoITBI { get; set; }

        [BsonElement("custoEscritura")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoEscritura { get; set; }

        [BsonElement("custoRegistro")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoRegistro { get; set; }

        [BsonElement("calculadoEm")]
        public DateTime CalculadoEm { get; set; } = DateTime.UtcNow;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
