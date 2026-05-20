using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PessoaController : ControllerBase
    {
        private readonly IPessoaRepository _pessoaRepository;

        public PessoaController(IPessoaRepository pessoaRepository)
        {
            _pessoaRepository = pessoaRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var pessoas = await _pessoaRepository.GetAllAsync();
            return Ok(pessoas);
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
