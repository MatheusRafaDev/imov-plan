using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class EvolucaoMensalParticipante
    {
        [BsonElement("participanteId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ParticipanteId { get; set; } = string.Empty;

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("aporteMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AporteMensal { get; set; }

        [BsonElement("aportesExtras")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AportesExtras { get; set; }

        [BsonElement("rendimentoLiquido")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal RendimentoLiquido { get; set; }

        [BsonElement("saldo")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Saldo { get; set; }
    }
}
