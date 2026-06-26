using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
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

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
