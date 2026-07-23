using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;
using ImovPlan.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ImovPlan.Infrastructure.Services
{
    public class AggregatedPontoInteresseService : IPontoInteresseService
    {
        private readonly IEnumerable<IPontoInteresseProvider> _providers;
        private readonly AppDbContext _dbContext;
        private readonly ILogger<AggregatedPontoInteresseService> _logger;

        public AggregatedPontoInteresseService(
            IEnumerable<IPontoInteresseProvider> providers,
            AppDbContext dbContext,
            ILogger<AggregatedPontoInteresseService> logger)
        {
            _providers = providers;
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<IEnumerable<PontoInteresse>> BuscarPontosInteresseAsync(double latitude, double longitude, double raioMetros, IEnumerable<string> categorias)
        {
            // Truncate lat/long to 3 decimal places for caching purposes (approx 110 meters precision)
            var latBusca = Math.Round(latitude, 3);
            var lonBusca = Math.Round(longitude, 3);
            var categoriasList = categorias.ToList();
            categoriasList.Sort();
            var categoriasHash = string.Join(",", categoriasList);

            // Check cache
            var cache = await _dbContext.PontosInteresseCache
                .FirstOrDefaultAsync(c => c.LatitudeBusca == latBusca &&
                                          c.LongitudeBusca == lonBusca &&
                                          c.RaioMetros == raioMetros &&
                                          c.CategoriasHash == categoriasHash);
            
            if (cache != null && cache.Resultados != null)
            {
                _logger.LogInformation("Pontos de interesse carregados do cache para lat:{Lat} lon:{Lon}", latitude, longitude);
                return cache.Resultados;
            }

            _logger.LogInformation("Buscando pontos de interesse em {Count} provedores para lat:{Lat} lon:{Lon}", _providers.Count(), latitude, longitude);

            // Fetch from all providers concurrently
            var tasks = _providers.Select(p => p.FetchAsync(latitude, longitude, raioMetros, categoriasList));
            var resultsArray = await Task.WhenAll(tasks);
            
            var allResults = resultsArray.SelectMany(r => r).ToList();

            // Deduplicate
            var mergedResults = DeduplicatePoints(allResults);

            mergedResults = mergedResults.OrderBy(r => r.DistanciaMetros).ToList();

            // Save to cache
            var novoCache = new PontoInteresseCache
            {
                LatitudeBusca = latBusca,
                LongitudeBusca = lonBusca,
                RaioMetros = raioMetros,
                CategoriasHash = categoriasHash,
                Resultados = mergedResults,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.PontosInteresseCache.Add(novoCache);
            await _dbContext.SaveChangesAsync();

            return mergedResults;
        }

        private List<PontoInteresse> DeduplicatePoints(List<PontoInteresse> rawPoints)
        {
            var deduplicated = new List<PontoInteresse>();

            foreach (var p in rawPoints)
            {
                // Check if we already have a similar point in the deduplicated list
                // Criteria: same category AND distance < 30 meters
                var existing = deduplicated.FirstOrDefault(d => 
                    d.Categoria == p.Categoria && 
                    HaversineDistance(d.Latitude, d.Longitude, p.Latitude, p.Longitude) < 30);

                if (existing == null)
                {
                    deduplicated.Add(p);
                }
                else
                {
                    // Merge tags to preserve information
                    foreach (var tag in p.Tags)
                    {
                        if (!existing.Tags.ContainsKey(tag.Key))
                        {
                            existing.Tags[tag.Key] = tag.Value;
                        }
                        else if (tag.Key == "source")
                        {
                            // Keep both sources
                            if (!existing.Tags["source"].Contains(tag.Value))
                            {
                                existing.Tags["source"] += $",{tag.Value}";
                            }
                        }
                    }
                }
            }

            return deduplicated;
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
    }
}
