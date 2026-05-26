using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class GastoDetalhado
    {
        [BsonElement("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("valor")]
        public decimal Valor { get; set; }
    }
}
