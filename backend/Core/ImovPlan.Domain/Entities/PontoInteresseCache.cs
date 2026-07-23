using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class PontoInteresseCache
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("latitudeBusca")]
        public double LatitudeBusca { get; set; }

        [BsonElement("longitudeBusca")]
        public double LongitudeBusca { get; set; }

        [BsonElement("raioMetros")]
        public double RaioMetros { get; set; }

        [BsonElement("categoriasHash")]
        public string CategoriasHash { get; set; } = string.Empty; // Useful for caching specific combination of categories

        [BsonElement("resultados")]
        public List<PontoInteresse> Resultados { get; set; } = new();

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
