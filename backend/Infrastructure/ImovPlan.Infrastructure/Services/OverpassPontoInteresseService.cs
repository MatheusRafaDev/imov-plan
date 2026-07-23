using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace ImovPlan.Infrastructure.Services
{
    public class OverpassPontoInteresseService : IPontoInteresseProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OverpassPontoInteresseService> _logger;

        public OverpassPontoInteresseService(HttpClient httpClient, ILogger<OverpassPontoInteresseService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "CasalPlanner/1.0 (Contact: matheusrafadev@github)");
        }

        public async Task<IEnumerable<PontoInteresse>> FetchAsync(double latitude, double longitude, double raioMetros, IEnumerable<string> categorias, System.Threading.CancellationToken cancellationToken = default)
        {
            var categoriasList = categorias.ToList();
            categoriasList.Sort();

            _logger.LogInformation("Buscando pontos de interesse na Overpass API para lat:{Lat} lon:{Lon}", latitude, longitude);
            
            var query = BuildOverpassQuery(latitude, longitude, raioMetros, categoriasList);
            var content = new StringContent(query, Encoding.UTF8, "application/x-www-form-urlencoded");

            var response = await _httpClient.PostAsync("https://overpass-api.de/api/interpreter", content, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Falha ao buscar Overpass API: {Status}", response.StatusCode);
                return Enumerable.Empty<PontoInteresse>();
            }

            OverpassResponse? overpassData = null;
            try 
            {
                var jsonResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                overpassData = JsonSerializer.Deserialize<OverpassResponse>(jsonResponse, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deserializar resposta da Overpass API. Retornando lista vazia.");
                return Enumerable.Empty<PontoInteresse>();
            }

            var resultados = new List<PontoInteresse>();
            if (overpassData?.Elements != null)
            {
                foreach (var element in overpassData.Elements)
                {
                    if (element.Type == "node")
                    {
                        var tagNome = element.Tags?.GetValueOrDefault("name") ?? "Desconhecido";
                        var categoriaEncontrada = DeterminarCategoria(element.Tags, categoriasList);

                        if (categoriaEncontrada != null)
                        {
                            var dist = HaversineDistance(latitude, longitude, element.Lat, element.Lon);
                            var tags = element.Tags ?? new Dictionary<string, string>();
                            tags["source"] = "osm";
                            
                            resultados.Add(new PontoInteresse
                            {
                                IdOsm = element.Id.ToString(),
                                Nome = tagNome,
                                Categoria = categoriaEncontrada,
                                Latitude = element.Lat,
                                Longitude = element.Lon,
                                DistanciaMetros = dist,
                                Tags = tags
                            });
                        }
                    }
                }
            }

            return resultados.OrderBy(r => r.DistanciaMetros).ToList();
        }

        private string BuildOverpassQuery(double lat, double lon, double radius, List<string> categorias)
        {
            var sb = new StringBuilder();
            sb.AppendLine("[out:json][timeout:25];");
            sb.AppendLine("(");

            foreach (var cat in categorias)
            {
                switch (cat.ToLower())
                {
                    case "mercado":
                        sb.AppendLine($"  node[\"shop\"~\"supermarket|convenience\"](around:{radius},{lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lon.ToString(System.Globalization.CultureInfo.InvariantCulture)});");
                        break;
                    case "farmacia":
                        sb.AppendLine($"  node[\"amenity\"=\"pharmacy\"](around:{radius},{lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lon.ToString(System.Globalization.CultureInfo.InvariantCulture)});");
                        break;
                    case "escola":
                        sb.AppendLine($"  node[\"amenity\"~\"school|kindergarten|university\"](around:{radius},{lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lon.ToString(System.Globalization.CultureInfo.InvariantCulture)});");
                        break;
                    case "padaria":
                        sb.AppendLine($"  node[\"shop\"=\"bakery\"](around:{radius},{lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lon.ToString(System.Globalization.CultureInfo.InvariantCulture)});");
                        break;
                    case "parque":
                        sb.AppendLine($"  node[\"leisure\"=\"park\"](around:{radius},{lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lon.ToString(System.Globalization.CultureInfo.InvariantCulture)});");
                        break;
                    case "hospital":
                        sb.AppendLine($"  node[\"amenity\"~\"hospital|clinic\"](around:{radius},{lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lon.ToString(System.Globalization.CultureInfo.InvariantCulture)});");
                        break;
                }
            }

            sb.AppendLine(");");
            sb.AppendLine("out body;");
            return sb.ToString();
        }

        private string? DeterminarCategoria(Dictionary<string, string>? tags, List<string> categoriasBuscadas)
        {
            if (tags == null) return null;

            if (categoriasBuscadas.Contains("mercado") && tags.TryGetValue("shop", out var shop) && (shop == "supermarket" || shop == "convenience"))
                return "mercado";
            if (categoriasBuscadas.Contains("farmacia") && tags.TryGetValue("amenity", out var amenity1) && amenity1 == "pharmacy")
                return "farmacia";
            if (categoriasBuscadas.Contains("escola") && tags.TryGetValue("amenity", out var amenity2) && (amenity2 == "school" || amenity2 == "kindergarten" || amenity2 == "university"))
                return "escola";
            if (categoriasBuscadas.Contains("padaria") && tags.TryGetValue("shop", out var shop2) && shop2 == "bakery")
                return "padaria";
            if (categoriasBuscadas.Contains("parque") && tags.TryGetValue("leisure", out var leisure) && leisure == "park")
                return "parque";
            if (categoriasBuscadas.Contains("hospital") && tags.TryGetValue("amenity", out var amenity3) && (amenity3 == "hospital" || amenity3 == "clinic"))
                return "hospital";

            return categoriasBuscadas.FirstOrDefault(); // fallback
        }

        private double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3; // Metros
            var p1 = lat1 * Math.PI / 180;
            var p2 = lat2 * Math.PI / 180;
            var dp = (lat2 - lat1) * Math.PI / 180;
            var dl = (lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(dp / 2) * Math.Sin(dp / 2) +
                    Math.Cos(p1) * Math.Cos(p2) *
                    Math.Sin(dl / 2) * Math.Sin(dl / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        private class OverpassResponse
        {
            public List<OverpassElement> Elements { get; set; } = new();
        }

        private class OverpassElement
        {
            public string Type { get; set; } = string.Empty;
            public long Id { get; set; }
            public double Lat { get; set; }
            public double Lon { get; set; }
            public Dictionary<string, string> Tags { get; set; } = new();
        }
    }
}
