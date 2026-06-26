using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/parametros-financeiros")]
    [Authorize]
    public class ParametrosFinanceirosController : ControllerBase
    {
        private readonly IParametrosFinanceirosRepository _repository;

        public ParametrosFinanceirosController(IParametrosFinanceirosRepository repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var parametros = await _repository.GetAtivoAsync();
            return Ok(parametros);
        }

        [HttpPut]
        public async Task<IActionResult> Put([FromBody] ParametrosFinanceiros parametros)
        {
            var atualizados = await _repository.UpsertAsync(parametros);
            return Ok(atualizados);
        }
    }
}
