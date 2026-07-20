using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var host = _configuration["SMTP_HOST"];
            var portString = _configuration["SMTP_PORT"];
            var user = _configuration["SMTP_USER"];
            var pass = _configuration["SMTP_PASS"];
            var fromName = _configuration["SMTP_FROM_NAME"] ?? "ImovPlan";

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass) || !int.TryParse(portString, out var port))
            {
                _logger.LogWarning("Configurações de SMTP incompletas. Email não enviado para {To}", to);
                return;
            }

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = true // Recomendado para a maioria dos provedores
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(user, fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml
                };

                mailMessage.To.Add(to);

                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Email enviado com sucesso para {To}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar email para {To}", to);
                throw;
            }
        }
    }
}
