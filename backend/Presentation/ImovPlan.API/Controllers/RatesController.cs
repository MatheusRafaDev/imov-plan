using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RatesController : ControllerBase
    {
        private readonly IFinancialRatesProvider _ratesProvider;

        public RatesController(IFinancialRatesProvider ratesProvider)
        {
            _ratesProvider = ratesProvider;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentRates()
        {
            var selic = await _ratesProvider.GetCurrentSelicAsync();
            var cdi = await _ratesProvider.GetCurrentCdiAsync();
            var ipca = await _ratesProvider.GetCurrentIpcaAsync();

            return Ok(new
            {
                Selic = selic,
                Cdi = cdi,
                Ipca = ipca
            });
        }
    }
}
