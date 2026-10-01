using System.Security.Claims;
using ImovPlan.API.Controllers;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ImovPlan.Application.Tests
{
    public class PlanoControllerTests
    {
        [Fact]
        public async Task UpdateDraft_WhenPlanBelongsToUser_PersistsAndReturnsNoContent()
        {
            var planoService = new Mock<IPlanoService>();
            var draft = new PlanoDraftDto();
            planoService
                .Setup(service => service.UpdateDraftAsync("plan-1", draft, "user-1"))
                .ReturnsAsync(true);
            var controller = CreateController(planoService.Object, "user-1");

            var result = await controller.UpdateDraft("plan-1", draft);

            Assert.IsType<NoContentResult>(result);
            planoService.Verify(service => service.UpdateDraftAsync("plan-1", draft, "user-1"), Times.Once);
        }

        [Fact]
        public async Task UpdateDraft_WhenPlanIsMissingOrUnauthorized_ReturnsNotFound()
        {
            var planoService = new Mock<IPlanoService>();
            planoService
                .Setup(service => service.UpdateDraftAsync(It.IsAny<string>(), It.IsAny<PlanoDraftDto>(), It.IsAny<string>()))
                .ReturnsAsync(false);
            var controller = CreateController(planoService.Object, "user-1");

            var result = await controller.UpdateDraft("plan-1", new PlanoDraftDto());

            Assert.IsType<NotFoundObjectResult>(result);
        }

        private static PlanoController CreateController(IPlanoService planoService, string usuarioId)
        {
            var controller = new PlanoController(planoService, NullLogger<PlanoController>.Instance);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[] { new Claim(ClaimTypes.NameIdentifier, usuarioId) },
                        "test"))
                }
            };

            return controller;
        }
    }
}
