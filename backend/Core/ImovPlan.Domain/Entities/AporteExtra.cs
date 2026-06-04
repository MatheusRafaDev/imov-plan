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

        [BsonElement("objetivoImovelId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjetivoImovelId { get; set; } = string.Empty;

        [BsonElement("pessoaId")]
        public string? PessoaId { get; set; } = null;

        [BsonElement("pessoaNome")]
        public string PessoaNome { get; set; } = string.Empty;

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
