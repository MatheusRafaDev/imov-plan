using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.Infrastructure.Services
{
    public class BrevoEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<BrevoEmailService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private const string SITE_URL = "https://imov-plan.vercel.app";

        public BrevoEmailService(IConfiguration configuration, ILogger<BrevoEmailService> logger, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        // ── IEmailService ────────────────────────────────────────────────────────
        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var apiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? _configuration["BREVO_API_KEY"];

            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("BREVO_API_KEY nao configurada. Email nao enviado para {To}", to);
                return;
            }

            var fromEmail = Environment.GetEnvironmentVariable("BREVO_FROM_EMAIL")
                         ?? _configuration["BREVO_FROM_EMAIL"]
                         ?? "noreply@imovplan.com";

            var payload = new
            {
                sender = new { name = "ImovPlan", email = fromEmail },
                to = new[] { new { email = to } },
                subject,
                htmlContent = isHtml ? body : $"<pre>{body}</pre>"
            };

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("api-key", apiKey);
                client.DefaultRequestHeaders.Add("Accept", "application/json");

                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email enviado via Brevo para {To}. Assunto: {Subject}", to, subject);
                    return;
                }

                _logger.LogError("Brevo retornou {Status} para {To}: {Body}", (int)response.StatusCode, to, responseBody);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar email via Brevo para {To}", to);
                throw;
            }
        }

        // ── Template helper ──────────────────────────────────────────────────────
        private string BuildHtmlWrapper(string headerGradient, string headerIcon, string innerContent, int anoAtual) => $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
            line-height: 1.6; background: linear-gradient(135deg,#18181B 0%,#27272A 100%);
            margin: 0; padding: 20px;
        }}
        .container {{
            max-width: 560px; margin: 0 auto; background: #27272A;
            border-radius: 16px; overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,.4); border: 1px solid #3F3F46;
        }}
        .header {{ background: {headerGradient}; padding: 32px 24px; text-align: center; }}
        .logo {{ font-size: 28px; font-weight: 800; color: #fff; display: flex; align-items: center; justify-content: center; gap: 12px; }}
        .content {{ padding: 40px 32px; }}
        .greeting {{ font-size: 24px; font-weight: 700; color: #F4F4F5; margin-bottom: 12px; }}
        .message {{ color: #D4D4D8; font-size: 15px; margin-bottom: 20px; }}
        .code-container {{ background: #18181B; border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0; border: 1px solid #3F3F46; }}
        .code-label {{ font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #A78BFA; margin-bottom: 16px; }}
        .code {{ font-size: 48px; letter-spacing: 12px; font-weight: 800; font-family: 'Courier New', monospace; color: #F9A8D4; background: #27272A; padding: 20px; border-radius: 12px; display: inline-block; border: 1px solid #3F3F46; }}
        .expiry {{ font-size: 12px; color: #71717A; margin-top: 16px; }}
        .info-box {{ background: #18181B; border-left: 4px solid #34D399; padding: 16px 20px; border-radius: 12px; margin: 24px 0; }}
        .warning-box {{ background: #18181B; border-left: 4px solid #F87171; padding: 16px 20px; border-radius: 12px; margin: 24px 0; }}
        .tips {{ background: #18181B; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #3F3F46; }}
        .tips-title {{ font-size: 14px; font-weight: 700; color: #F9A8D4; margin-bottom: 12px; }}
        .tips-list {{ list-style: none; padding: 0; margin: 0; }}
        .tips-list li {{ font-size: 13px; color: #D4D4D8; padding: 8px 0 8px 24px; position: relative; }}
        .tips-list li::before {{ content: 'OK'; position: absolute; left: 0; color: #A78BFA; font-weight: bold; }}
        .highlight-box {{ background: #18181B; border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid #3F3F46; }}
        .button {{ display: inline-block; background: linear-gradient(135deg,#A78BFA 0%,#F9A8D4 100%); color: white; padding: 12px 28px; border-radius: 40px; text-decoration: none; font-weight: 600; margin-top: 16px; }}
        .footer {{ background: #18181B; padding: 24px 32px; text-align: center; border-top: 1px solid #3F3F46; }}
        .footer-text {{ color: #71717A; font-size: 12px; margin: 8px 0; }}
        @media (max-width: 600px) {{
            body {{ padding: 12px; }} .content {{ padding: 28px 20px; }}
            .code {{ font-size: 32px; letter-spacing: 8px; padding: 16px; }} .greeting {{ font-size: 20px; }}
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <div class='logo'><span>{headerIcon}</span><span>ImovPlan</span></div>
        </div>
        {innerContent}
        <div class='footer'>
            <div class='footer-text'>🏠 <strong>ImovPlan</strong> — Seu planejamento imobiliario inteligente</div>
            <div class='footer-text'>© {anoAtual} ImovPlan. Todos os direitos reservados.</div>
            <div class='footer-text'><a href='{SITE_URL}' style='color:#A78BFA;text-decoration:none;'>Acesse nosso site</a></div>
        </div>
    </div>
</body>
</html>";

        // ── Recuperacao de senha ──────────────────────────────────────────────────
        public async Task<bool> EnviarCodigoRedefinicaoSenha(string email, string codigo, string nome = "")
        {
            try
            {
                var saudacao = string.IsNullOrEmpty(nome) ? "Ola" : $"Ola {nome}";
                var anoAtual = DateTime.UtcNow.Year;

                var inner = $@"
<div class='content'>
    <div class='greeting'>{saudacao}! 👋</div>
    <div class='message'>Recebemos uma solicitacao para redefinir sua senha no <strong>ImovPlan</strong>. Utilize o codigo abaixo para prosseguir.</div>
    <div class='code-container'>
        <div class='code-label'>🔑 CODIGO DE VERIFICACAO</div>
        <div class='code'>{codigo}</div>
        <div class='expiry'>⏰ Valido por <strong>15 minutos</strong></div>
    </div>
    <div class='info-box'>
        <p style='color:#34D399;font-size:14px;font-weight:500;'>📋 Digite este codigo na pagina de recuperacao de senha para continuar.</p>
    </div>
    <div class='warning-box'>
        <p style='color:#F87171;font-size:14px;font-weight:500;'>⚠️ Se voce nao solicitou essa alteracao, ignore este email. Sua senha permanecera inalterada.</p>
    </div>
    <div class='tips'>
        <div class='tips-title'>🔒 Dicas de seguranca</div>
        <ul class='tips-list'>
            <li>Nunca compartilhe este codigo com ninguem</li>
            <li>Nossa equipe nunca solicitara este codigo</li>
            <li>Use uma senha forte e unica para sua conta</li>
        </ul>
    </div>
</div>";

                var html = BuildHtmlWrapper("linear-gradient(135deg,#A78BFA 0%,#F9A8D4 100%)", "🔐", inner, anoAtual);
                await SendEmailAsync(email, "🔐 Recuperacao de senha - ImovPlan", html);
                _logger.LogInformation("Email de recuperacao enviado para {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar email de recuperacao para {Email}", email);
                return false;
            }
        }

        // ── Boas-vindas ──────────────────────────────────────────────────────────
        public async Task<bool> EnviarEmailBoasVindas(string email, string nome)
        {
            try
            {
                var anoAtual = DateTime.UtcNow.Year;

                var inner = $@"
<div class='content'>
    <div class='greeting'>Bem-vindo(a) ao ImovPlan, {nome}! 🎉</div>
    <div class='message'>Estamos muito felizes em ter voce conosco! Sua conta foi criada com sucesso.</div>
    <div class='highlight-box'>
        <p style='color:#A78BFA;margin-bottom:8px;'>✨ Seu primeiro passo ✨</p>
        <p style='color:#D4D4D8;'>Comece agora simulando seu financiamento e planejando a compra do seu imovel!</p>
        <a href='{SITE_URL}' class='button'>Acessar minha conta</a>
    </div>
    <div class='tips'>
        <div class='tips-title'>💡 Dicas para comecar</div>
        <ul class='tips-list'>
            <li>Complete seu perfil com suas informacoes pessoais</li>
            <li>Simule diferentes cenarios de financiamento</li>
            <li>Explore os imoveis disponiveis na sua regiao</li>
            <li>Configure seus alertas de oportunidades</li>
        </ul>
    </div>
</div>";

                var html = BuildHtmlWrapper("linear-gradient(135deg,#A78BFA 0%,#F9A8D4 100%)", "🏠", inner, anoAtual);
                await SendEmailAsync(email, "🎉 Bem-vindo(a) ao ImovPlan!", html);
                _logger.LogInformation("Email de boas-vindas enviado para {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar email de boas-vindas para {Email}", email);
                return false;
            }
        }

        // ── Aviso de senha alterada ──────────────────────────────────────────────
        public async Task<bool> EnviarAvisoSenhaAlterada(string email, string nome)
        {
            try
            {
                var anoAtual = DateTime.UtcNow.Year;

                var inner = $@"
<div class='content'>
    <div class='greeting'>Ola {nome},</div>
    <div class='message'>Sua senha foi <strong>alterada com sucesso</strong> em sua conta do ImovPlan.</div>
    <div class='info-box'>
        <p style='color:#34D399;font-weight:600;margin-bottom:8px;'>✅ Alteracao realizada</p>
        <p style='color:#D4D4D8;font-size:14px;'>Se voce foi quem realizou esta alteracao, nenhuma acao e necessaria.</p>
    </div>
    <div class='warning-box'>
        <p style='color:#F87171;font-weight:600;margin-bottom:8px;'>⚠️ Nao foi voce?</p>
        <p style='color:#D4D4D8;font-size:14px;'>Se voce nao reconhece esta alteracao, recupere seu acesso imediatamente.</p>
        <a href='{SITE_URL}/recuperar-senha' class='button'>Recuperar acesso</a>
    </div>
</div>";

                var html = BuildHtmlWrapper("linear-gradient(135deg,#F9A8D4 0%,#A78BFA 100%)", "🔒", inner, anoAtual);
                await SendEmailAsync(email, "🔒 Sua senha foi alterada - ImovPlan", html);
                _logger.LogInformation("Aviso de senha alterada enviado para {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar aviso de senha alterada para {Email}", email);
                return false;
            }
        }

        // ── Exclusao de conta ────────────────────────────────────────────────────
        public async Task<bool> EnviarEmailExclusaoConta(string email, string nome)
        {
            try
            {
                var anoAtual = DateTime.UtcNow.Year;

                var inner = $@"
<div class='content'>
    <div class='greeting'>Ola {nome},</div>
    <div class='message'>Sua conta foi <strong>excluida permanentemente</strong> do ImovPlan conforme sua solicitacao.</div>
    <div class='warning-box'>
        <p style='color:#F87171;font-weight:600;margin-bottom:12px;'>⚠️ O que aconteceu com seus dados?</p>
        <ul style='color:#D4D4D8;margin-left:20px;'>
            <li>Todos os seus dados e simulacoes foram removidos</li>
            <li>Seus planos personalizados foram deletados</li>
            <li>Todo historico de atividades foi apagado</li>
            <li>As informacoes nao podem ser recuperadas</li>
        </ul>
    </div>
    <div class='info-box'>
        <p style='color:#34D399;font-weight:600;margin-bottom:8px;'>💡 Sentimos sua falta!</p>
        <p style='color:#D4D4D8;font-size:14px;'>Se voce mudar de ideia, pode criar uma nova conta a qualquer momento.</p>
        <a href='{SITE_URL}' class='button'>Criar nova conta</a>
    </div>
</div>";

                var html = BuildHtmlWrapper("linear-gradient(135deg,#F87171 0%,#EF4444 100%)", "📋", inner, anoAtual);
                await SendEmailAsync(email, "📋 Confirmacao de exclusao de conta - ImovPlan", html);
                _logger.LogInformation("Email de exclusao de conta enviado para {Email}", email);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar email de exclusao para {Email}", email);
                return false;
            }
        }
    }
}
