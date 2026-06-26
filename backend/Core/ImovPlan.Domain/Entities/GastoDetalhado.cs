using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class GastoDetalhado
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("planejamentoId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string PlanejamentoId { get; set; } = string.Empty;

        [BsonElement("participanteId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ParticipanteId { get; set; } = string.Empty;

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("valor")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Valor { get; set; }

        [BsonElement("categoria")]
        public string Categoria { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
