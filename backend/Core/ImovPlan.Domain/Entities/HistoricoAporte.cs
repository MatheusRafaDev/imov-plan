using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class HistoricoAporte
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("planejamentoId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string PlanejamentoId { get; set; } = string.Empty;

        /// <summary>
        /// ParticipanteId associado à edição. Pode ser vazio para edições no nível do plano.
        /// </summary>
        [BsonElement("participanteId")]
        public string ParticipanteId { get; set; } = string.Empty;

        /// <summary>
        /// Número do mês (1-based) relativo ao plano.
        /// </summary>
        [BsonElement("mes")]
        public int Mes { get; set; }

        [BsonElement("valorEditado")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorEditado { get; set; }

        [BsonElement("editadoEm")]
        public DateTime EditadoEm { get; set; } = DateTime.UtcNow;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
