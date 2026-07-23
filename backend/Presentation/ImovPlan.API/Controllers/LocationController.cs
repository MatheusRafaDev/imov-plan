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
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return BadRequest("Query is required");

            using var httpClient = new System.Net.Http.HttpClient();
            httpClient.DefaultRequestHeaders.Add("User-Agent", "CasalPlanner/1.0 (Contact: matheusrafadev@github)");

            var url = $"https://nominatim.openstreetmap.org/search?format=json&q={System.Uri.EscapeDataString(q)}&addressdetails=1&limit=5";
            var response = await httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Erro ao buscar no Nominatim");
            
            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }

        [HttpGet("reverse")]
        public async Task<IActionResult> Reverse([FromQuery] double lat, [FromQuery] double lon)
        {
            using var httpClient = new System.Net.Http.HttpClient();
            httpClient.DefaultRequestHeaders.Add("User-Agent", "CasalPlanner/1.0 (Contact: matheusrafadev@github)");

            var url = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}&lon={lon.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
            var response = await httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Erro ao buscar no Nominatim");
            
            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }
    }
}
