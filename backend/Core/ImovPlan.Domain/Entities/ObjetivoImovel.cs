using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class ObjetivoImovel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("nomePlano")]
        public string NomePlano { get; set; } = "Imóvel";

        [BsonElement("valorImovel")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorImovel { get; set; }

        [BsonElement("percentualEntrada")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualEntrada { get; set; }

        [BsonElement("percentualCustosExtras")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualCustosExtras { get; set; }

        [BsonElement("prazoMaxMeses")]
        public int PrazoMaxMeses { get; set; }

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

        [BsonElement("taxaCdiAnual")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaCdiAnual { get; set; }

        [BsonElement("percentualCdi")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal PercentualCdi { get; set; }

        [BsonElement("dataInicio")]
        public DateTime? DataInicio { get; set; }

        // Banco escolhido (embedded)
        [BsonElement("bancoEscolhidoId")]
        public string? BancoEscolhidoId { get; set; }

        [BsonElement("bancoEscolhidoNome")]
        public string? BancoEscolhidoNome { get; set; }

        [BsonElement("bancoEscolhidoTaxa")]
        [BsonRepresentation(BsonType.Decimal128)]
        public decimal? BancoEscolhidoTaxa { get; set; }

        [BsonElement("pessoasIds")]
        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> PessoasIds { get; set; } = new();

        [BsonElement("aportesExtras")]
        public List<AporteExtra> AportesExtras { get; set; } = new();

        [BsonElement("aportesRegularesEditados")]
        [NotMapped]
        public Dictionary<int, decimal> AportesRegularesEditados { get; set; } = new();

        [BsonElement("mesesConcluidos")]
        public List<int> MesesConcluidos { get; set; } = new();

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
