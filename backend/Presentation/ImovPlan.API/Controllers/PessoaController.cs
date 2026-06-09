using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PessoaController : ControllerBase
    {
        private readonly IPessoaRepository _pessoaRepository;

        public PessoaController(IPessoaRepository pessoaRepository)
        {
            _pessoaRepository = pessoaRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string objetivoImovelId)
        {
            if (string.IsNullOrEmpty(objetivoImovelId))
                return BadRequest("objetivoImovelId is required.");

            var allPessoas = await _pessoaRepository.GetAllAsync();
            var filteredPessoas = allPessoas.Where(p => p.ObjetivoImovelId == objetivoImovelId).ToList();
            return Ok(filteredPessoas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var pessoa = await _pessoaRepository.GetByIdAsync(id);
            if (pessoa == null) return NotFound();
            return Ok(pessoa);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Pessoa pessoa)
        {
            var created = await _pessoaRepository.CreateAsync(pessoa);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Pessoa pessoa)
        {
            await _pessoaRepository.UpdateAsync(id, pessoa);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _pessoaRepository.DeleteAsync(id);
            return NoContent();
        }
    }
}
