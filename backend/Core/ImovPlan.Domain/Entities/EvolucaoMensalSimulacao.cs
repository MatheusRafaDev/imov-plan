using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class EvolucaoMensalSimulacao
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("simulacaoId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SimulacaoId { get; set; } = string.Empty;  // FK → HistoricoSimulacao

        [BsonElement("mes")]
        public int Mes { get; set; }

        [BsonElement("dataReferencia")]
        public DateTime DataReferencia { get; set; }

        [BsonElement("aporteMensal")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AporteMensal { get; set; }

        [BsonElement("aportesExtras")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal AportesExtras { get; set; }

        [BsonElement("rendimentoBruto")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal RendimentoBruto { get; set; }

        [BsonElement("imposto")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Imposto { get; set; }

        [BsonElement("rendimentoLiquido")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal RendimentoLiquido { get; set; }

        [BsonElement("totalAcumulado")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalAcumulado { get; set; }

        [BsonElement("participantes")]
        public List<EvolucaoMensalParticipante> Participantes { get; set; } = new();
    }
}
