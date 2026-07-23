using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationProvider _locationProvider;

        public LocationController(ILocationProvider locationProvider)
        {
            _locationProvider = locationProvider;
        }

        [HttpGet("cep/{cep}")]
        public async Task<IActionResult> GetAddressByCep(string cep)
        {
            var address = await _locationProvider.GetAddressByCepAsync(cep);
            
            if (address == null)
            {
                return NotFound(new { Message = "CEP não encontrado." });
            }

            return Ok(address);
        }
    }
}
