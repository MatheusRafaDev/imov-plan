using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ImovPlan.Application.Services.Interfaces;
using Resend;

namespace ImovPlan.Infrastructure.Services
{
    public class ResendEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ResendEmailService> _logger;

        public ResendEmailService(IConfiguration configuration, ILogger<ResendEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var apiKey = _configuration["RESEND_API_KEY"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("RESEND_API_KEY não configurada. Email não enviado para {To}", to);
                return;
            }

            try
            {
                IResend resend = ResendClient.Create(apiKey);

                var message = new EmailMessage
                {
                    From = "onboarding@resend.dev", // Alterar depois para o domínio autenticado se necessário
                    To = to,
                    Subject = subject,
                };

                if (isHtml)
                {
                    message.HtmlBody = body;
                }
                else
                {
                    message.TextBody = body;
                }

                var response = await resend.EmailSendAsync(message);
                _logger.LogInformation("Email enviado com sucesso para {To} via Resend. Id: {Id}", to, response.Content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar email para {To} via Resend", to);
                throw;
            }
        }
    }
}
