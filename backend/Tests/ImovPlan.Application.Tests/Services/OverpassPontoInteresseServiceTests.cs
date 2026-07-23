using System.Collections.Generic;
using ImovPlan.Infrastructure.Services;
using Xunit;

namespace ImovPlan.Application.Tests.Services
{
    public class OverpassPontoInteresseServiceTests
    {
        [Fact]
        public void DeterminarCategoria_ShouldReturnCorrectCategory_WhenTagIsExact()
        {
            // Arrange
            var tags = new Dictionary<string, string> { { "shop", "supermarket" } };
            var categoriasBuscadas = new List<string> { "mercado", "farmacia" };

            // Act
            var result = OverpassPontoInteresseService.DeterminarCategoria(tags, categoriasBuscadas);

            // Assert
            Assert.Equal("mercado", result);
        }

        [Fact]
        public void DeterminarCategoria_ShouldReturnCorrectCategory_WhenTagIsCompositeWithSemicolon()
        {
            // Arrange
            var tags = new Dictionary<string, string> { { "shop", "convenience;newsagent" } };
            var categoriasBuscadas = new List<string> { "mercado", "padaria" };

            // Act
            var result = OverpassPontoInteresseService.DeterminarCategoria(tags, categoriasBuscadas);

            // Assert
            Assert.Equal("mercado", result);
        }

        [Fact]
        public void DeterminarCategoria_ShouldReturnNull_WhenTagIsNotRelated()
        {
            // Arrange
            var tags = new Dictionary<string, string> { { "amenity", "post_office" } };
            var categoriasBuscadas = new List<string> { "escola", "farmacia", "hospital" };

            // Act
            var result = OverpassPontoInteresseService.DeterminarCategoria(tags, categoriasBuscadas);

            // Assert
            Assert.Null(result);
        }
    }
}
