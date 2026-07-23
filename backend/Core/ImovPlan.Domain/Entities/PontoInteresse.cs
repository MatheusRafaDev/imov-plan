using System;
using System.Collections.Generic;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ImovPlan.Domain.Entities
{
    public class PontoInteresse
    {
        [BsonElement("idOsm")]
        public string IdOsm { get; set; } = string.Empty;

        [BsonElement("nome")]
        public string Nome { get; set; } = string.Empty;

        [BsonElement("categoria")]
        public string Categoria { get; set; } = string.Empty;

        [BsonElement("latitude")]
        public double Latitude { get; set; }

        [BsonElement("longitude")]
        public double Longitude { get; set; }

        [BsonElement("distanciaMetros")]
        public double DistanciaMetros { get; set; }

        [BsonElement("tags")]
        public Dictionary<string, string> Tags { get; set; } = new();
    }
}
