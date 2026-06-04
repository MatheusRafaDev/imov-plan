using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class SaldoInicial
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("pessoaId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string PessoaId { get; set; } = string.Empty;

        [BsonElement("objetivoImovelId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ObjetivoImovelId { get; set; } = string.Empty;

        [BsonElement("valor")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Valor { get; set; }

        /// <summary>
        /// Fonte do saldo inicial. Ex: "Poupança", "FGTS", "Investimento".
        /// </summary>
        [BsonElement("fonte")]
        public string Fonte { get; set; } = string.Empty;

        [BsonElement("registradoEm")]
        public DateTime RegistradoEm { get; set; } = DateTime.UtcNow;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
