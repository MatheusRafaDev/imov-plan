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
            mockProvider.Setup(p => p.FetchAsync(It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<IEnumerable<string>>()))
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
            
            // The provider should have been called exactly once
            mockProvider.Verify(p => p.FetchAsync(It.IsAny<double>(), It.IsAny<double>(), It.IsAny<double>(), It.IsAny<IEnumerable<string>>()), Times.Once);
        }
    }
}
