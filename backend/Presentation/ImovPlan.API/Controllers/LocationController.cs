using System.Threading.Tasks;
using System.Net.Http;
using ImovPlan.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ImovPlan.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationProvider _locationProvider;
        private readonly IHttpClientFactory _httpClientFactory;

        public LocationController(ILocationProvider locationProvider, IHttpClientFactory httpClientFactory)
        {
            _locationProvider = locationProvider;
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("cep/{cep}")]
        [EnableRateLimiting("geocode")]
        public async Task<IActionResult> GetAddressByCep(string cep)
        {
            var address = await _locationProvider.GetAddressByCepAsync(cep);
            
            if (address == null)
            {
                return NotFound(new { Message = "CEP não encontrado." });
            }

            return Ok(address);
        }

        [HttpGet("search")]
        [EnableRateLimiting("geocode")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return BadRequest("Query is required");

            var httpClient = _httpClientFactory.CreateClient("Nominatim");

            var url = $"https://nominatim.openstreetmap.org/search?format=json&q={System.Uri.EscapeDataString(q)}&addressdetails=1&limit=5";
            var response = await httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Erro ao buscar no Nominatim");
            
            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }

        [HttpGet("reverse")]
        [EnableRateLimiting("geocode")]
        public async Task<IActionResult> Reverse([FromQuery] double lat, [FromQuery] double lon)
        {
            var httpClient = _httpClientFactory.CreateClient("Nominatim");

            var url = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}&lon={lon.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
            var response = await httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Erro ao buscar no Nominatim");
            
            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }
    }
}
