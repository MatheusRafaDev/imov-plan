using System.Threading.Tasks;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    }
}
