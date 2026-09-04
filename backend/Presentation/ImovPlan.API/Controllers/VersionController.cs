using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace ImovPlan.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VersionController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetVersion()
        {
            // O arquivo version.txt será mapeado via volume ou copiado
            var commitHash = "Unknown";
            if (System.IO.File.Exists("version.txt"))
            {
                commitHash = System.IO.File.ReadAllText("version.txt").Trim();
            }

            var deployLog = "No deploy log available";
            if (System.IO.File.Exists("deploy.log"))
            {
                deployLog = System.IO.File.ReadAllText("deploy.log");
            }

            return Ok(new
            {
                Commit = commitHash,
                LastDeployLog = deployLog
            });
        }
    }
}
