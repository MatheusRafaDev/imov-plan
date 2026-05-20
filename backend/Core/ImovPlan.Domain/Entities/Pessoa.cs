using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class Pessoa
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("rendaMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal RendaMensal { get; set; }

        [BsonElement("gastosMensais")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal GastosMensais { get; set; }

        [BsonElement("sobraMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal SobraMensal { get; set; }

        [BsonElement("aporteMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AporteMensal { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
