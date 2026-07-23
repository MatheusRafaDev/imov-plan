using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ImovPlan.Infrastructure.Services
{
    public class SerpApiPontoInteresseService : IPontoInteresseProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<SerpApiPontoInteresseService> _logger;
        private readonly string _serpApiKey;

        public SerpApiPontoInteresseService(
            HttpClient httpClient, 
            IConfiguration configuration,
            ILogger<SerpApiPontoInteresseService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _serpApiKey = configuration["SERPAPI_KEY"] ?? string.Empty;
        }

        public async Task<IEnumerable<PontoInteresse>> FetchAsync(double latitude, double longitude, double raioMetros, IEnumerable<string> categorias, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(_serpApiKey))
            {
                _logger.LogWarning("SERPAPI_KEY não configurada. Usando fallback vazio.");
                return Enumerable.Empty<PontoInteresse>();
            }

            var categoriasList = categorias.ToList();
            categoriasList.Sort();

            _logger.LogInformation("Buscando pontos no SerpAPI para lat:{Lat} lon:{Lon}", latitude, longitude);
            // Busca paralela
            var tasks = categoriasList.Select(async cat =>
            {
                var catResultados = new List<PontoInteresse>();
                var latStr = latitude.ToString(CultureInfo.InvariantCulture);
                var lonStr = longitude.ToString(CultureInfo.InvariantCulture);
                var url = $"https://serpapi.com/search.json?engine=google_local&q={Uri.EscapeDataString(cat)}&ll=@{latStr},{lonStr},14z&api_key={_serpApiKey}";
                
                try
                {
                    var response = await _httpClient.GetAsync(url, cancellationToken);
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        var serpData = JsonSerializer.Deserialize<SerpApiLocalResponse>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                        if (serpData?.LocalResults != null)
                        {
                            foreach (var place in serpData.LocalResults)
                            {
                                // Apenas adiciona se tiver gps_coordinates
                                if (place.GpsCoordinates != null)
                                {
                                    var dist = HaversineDistance(latitude, longitude, place.GpsCoordinates.Latitude, place.GpsCoordinates.Longitude);
                                    
                                    // Filtra pelo raio
                                    if (dist <= raioMetros)
                                    {
                                        catResultados.Add(new PontoInteresse
                                        {
                                            IdOsm = place.PlaceId ?? Guid.NewGuid().ToString(),
                                            Nome = place.Title ?? "Desconhecido",
                                            Categoria = cat,
                                            Latitude = place.GpsCoordinates.Latitude,
                                            Longitude = place.GpsCoordinates.Longitude,
                                            DistanciaMetros = dist,
                                            Tags = new Dictionary<string, string>
                                            {
                                                { "rating", place.Rating?.ToString() ?? "0" },
                                                { "reviews", place.Reviews?.ToString() ?? "0" },
                                                { "address", place.Address ?? "" },
                                                { "source", "google" }
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao buscar categoria {Categoria} no SerpAPI", cat);
                }
                return catResultados;
            });

            var resultadosArrays = await Task.WhenAll(tasks);
            var resultados = resultadosArrays.SelectMany(r => r).ToList();

            // Remove duplicatas internas
            return resultados
                .GroupBy(r => r.IdOsm)
                .Select(g => g.First())
                .OrderBy(r => r.DistanciaMetros)
                .ToList();
        }

        private double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3;
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

        private class SerpApiLocalResponse
        {
            public List<SerpApiLocalResult>? LocalResults { get; set; }
        }

        private class SerpApiLocalResult
        {
            public string? Title { get; set; }
            public string? PlaceId { get; set; }
            public double? Rating { get; set; }
            public int? Reviews { get; set; }
            public string? Address { get; set; }
            public GpsCoordinates? GpsCoordinates { get; set; }
        }

        private class GpsCoordinates
        {
            public double Latitude { get; set; }
            public double Longitude { get; set; }
        }
    }
}
