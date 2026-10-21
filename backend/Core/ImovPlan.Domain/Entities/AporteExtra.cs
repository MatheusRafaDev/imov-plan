using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    [BsonIgnoreExtraElements]
    public class AporteExtra
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("planejamentoId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string PlanejamentoId { get; set; } = string.Empty;

        [BsonElement("participanteId")]
        public string? ParticipanteId { get; set; } = null;

        [BsonElement("valor")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Valor { get; set; }

        [BsonElement("data")]
        public DateTime Data { get; set; }

        [BsonElement("origem")]
        public string Origem { get; set; } = string.Empty; // FGTS, Bônus, Freelance, etc.

        [BsonElement("tipo")]
        [BsonDefaultValue("Aporte")]
        [BsonIgnoreIfNull]
        public string? Tipo { get; set; } = "Aporte"; // "Aporte" ou "Retirada"

        [BsonElement("motivo")]
        public string? Motivo { get; set; }

        [BsonElement("revertido")]
        [BsonDefaultValue(false)]
        [BsonIgnoreIfNull]
        public bool? Revertido { get; set; } = false;

        [BsonElement("revertidoEm")]
        public DateTime? RevertidoEm { get; set; }

        [BsonElement("createdAt")]
        [BsonIgnoreIfNull]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
