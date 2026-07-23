using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using ImovPlan.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace ImovPlan.Application.Tests.Services
{
    public class SerpApiPontoInteresseServiceTests
    {
        [Fact]
        public async Task FetchAsync_ShouldRunCategoriesInParallel()
        {
            // Arrange
            var mockHandler = new Mock<HttpMessageHandler>();

            // Simulate a delay of 500ms for each request
            mockHandler.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .Returns(async (HttpRequestMessage request, CancellationToken token) =>
                {
                    await Task.Delay(500, token);
                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("{ \"local_results\": [] }")
                    };
                });

            var httpClient = new HttpClient(mockHandler.Object);
            
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["SERPAPI_KEY"]).Returns("mock_key");
            
            var mockLogger = new Mock<ILogger<SerpApiPontoInteresseService>>();

            var service = new SerpApiPontoInteresseService(httpClient, mockConfig.Object, mockLogger.Object);

            var categorias = new List<string> { "mercado", "farmacia", "escola", "padaria", "parque", "hospital" }; // 6 categories

            var sw = Stopwatch.StartNew();

            // Act
            var result = await service.FetchAsync(0, 0, 1000, categorias);

            sw.Stop();

            // Assert
            // If it were sequential, it would take at least 6 * 500ms = 3000ms.
            // Since it is parallel, it should take around 500ms (we allow up to 1500ms for overhead).
            Assert.True(sw.ElapsedMilliseconds < 1500, $"Expected parallel execution to take < 1500ms, took {sw.ElapsedMilliseconds}ms");
            
            mockHandler.Protected().Verify(
                "SendAsync",
                Times.Exactly(6),
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            );
        }
    }
}
