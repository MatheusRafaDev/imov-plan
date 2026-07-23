using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;
using ImovPlan.Infrastructure.Data;
using ImovPlan.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;
using Xunit;

namespace ImovPlan.Application.Tests.Services
{
    public class AggregatedPontoInteresseServiceTests
    {
        [Fact]
        public async Task BuscarPontosInteresseAsync_ShouldUseCacheOnSecondCall()
        {
            // Arrange
            var cacheData = new List<PontoInteresseCache>();
            var mockDbSet = cacheData.BuildMockDbSet<PontoInteresseCache>();
            mockDbSet.Setup(m => m.Add(It.IsAny<PontoInteresseCache>())).Callback<PontoInteresseCache>(c => cacheData.Add(c));

            var options = new DbContextOptionsBuilder<AppDbContext>().Options;
            var mockDbContext = new Mock<AppDbContext>(options);
            mockDbContext.Setup(db => db.PontosInteresseCache).Returns(mockDbSet.Object);
            
            var mockProvider = new Mock<IPontoInteresseProvider>();
            mockProvider.Setup(p => p.FetchAsync(It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<IEnumerable<string>>(), It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new List<PontoInteresse> 
                { 
                    new PontoInteresse { IdOsm = "1", Nome = "Mercado Mock", Categoria = "mercado" }
                });

            var providers = new List<IPontoInteresseProvider> { mockProvider.Object };
            var mockLogger = new Mock<ILogger<AggregatedPontoInteresseService>>();

            var service = new AggregatedPontoInteresseService(providers, mockDbContext.Object, mockLogger.Object);

            var lat = -23.550;
            var lon = -46.633;
            var raio = 1000;
            var categorias = new List<string> { "mercado" };

            // Act 1: First call should hit the provider and add to cache
            var result1 = await service.BuscarPontosInteresseAsync(lat, lon, raio, categorias);

            // Update the mock db set with the new item so FirstOrDefaultAsync finds it
            var mockDbSet2 = cacheData.BuildMockDbSet<PontoInteresseCache>();
            mockDbContext.Setup(db => db.PontosInteresseCache).Returns(mockDbSet2.Object);

            // Act 2: Second call should hit the cache
            var result2 = await service.BuscarPontosInteresseAsync(lat, lon, raio, categorias);

            // Assert
            Assert.NotNull(result1);
            Assert.NotNull(result2);
            Assert.Single(result1);
            Assert.Single(result2);
            
            // Deve ter chamado o provedor apenas 1 vez (na primeira busca)
            mockProvider.Verify(p => p.FetchAsync(It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<IEnumerable<string>>(), It.IsAny<System.Threading.CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task BuscarPontosInteresseAsync_ShouldTimeoutSlowProvidersAndReturnIn8Seconds()
        {
            // Arrange
            var mockDbContext = new Mock<AppDbContext>(new DbContextOptions<AppDbContext>());
            var mockDbSet = new List<PontoInteresseCache>().BuildMockDbSet();
            mockDbContext.Setup(db => db.PontosInteresseCache).Returns(mockDbSet.Object);

            var fastProvider = new Mock<IPontoInteresseProvider>();
            fastProvider.Setup(p => p.FetchAsync(It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<PontoInteresse> { new PontoInteresse { IdOsm = "fast", Categoria = "mercado" } });

            var slowProvider = new Mock<IPontoInteresseProvider>();
            slowProvider.Setup(p => p.FetchAsync(It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
                .Returns(async (double lat, double lon, double r, IEnumerable<string> cat, CancellationToken ct) => 
                {
                    await Task.Delay(15000, ct); // Should trigger cancellation
                    return new List<PontoInteresse> { new PontoInteresse { IdOsm = "slow" } };
                });

            var providers = new List<IPontoInteresseProvider> { fastProvider.Object, slowProvider.Object };
            var mockLogger = new Mock<ILogger<AggregatedPontoInteresseService>>();

            var service = new AggregatedPontoInteresseService(providers, mockDbContext.Object, mockLogger.Object);
            
            var sw = System.Diagnostics.Stopwatch.StartNew();

            // Act
            var result = await service.BuscarPontosInteresseAsync(0, 0, 1000, new[] { "mercado" });

            sw.Stop();

            // Assert
            // It should take around 8 seconds. We give it some tolerance.
            Assert.True(sw.Elapsed.TotalSeconds >= 7 && sw.Elapsed.TotalSeconds <= 10, $"Esperado ~8s, mas levou {sw.Elapsed.TotalSeconds}s");
            Assert.Single(result); // Apenas o resultado do fastProvider
            Assert.Equal("fast", result.First().IdOsm);
        }
    }
}
