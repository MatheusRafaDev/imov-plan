using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class ObjetivoImovel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("valorImovel")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorImovel { get; set; }

        [BsonElement("percentualEntrada")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualEntrada { get; set; }

        [BsonElement("prazoMeses")]
        public int PrazoMeses { get; set; }

        [BsonElement("valorEntrada")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorEntrada { get; set; }

        [BsonElement("custoITBI")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoITBI { get; set; }

        [BsonElement("custoEscritura")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoEscritura { get; set; }

        [BsonElement("custoRegistro")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal CustoRegistro { get; set; }

        [BsonElement("totalNecessario")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TotalNecessario { get; set; }

        [BsonElement("valorJaGuardado")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorJaGuardado { get; set; }

        [BsonElement("taxaCDI")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaCDI { get; set; }

        [BsonElement("pessoasIds")]
        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> PessoasIds { get; set; } = new();

        [BsonElement("aportesExtras")]
        public List<AporteExtra> AportesExtras { get; set; } = new();

        [BsonElement("usuarioId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? UsuarioId { get; set; }

        [BsonElement("sessionId")]
        public string? SessionId { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "Draft"; // "Draft", "Completed"

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
