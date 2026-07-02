using System;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.API.Services
{
    /// <summary>
    /// Hosted service que roda em background e simula o envio de lembretes/notificações
    /// para usuários com planejamentos ativos. Em produção, substituir o Console.WriteLine
    /// por chamadas a um provider de e-mail (SendGrid, AWS SES, etc).
    /// </summary>
    public class LembretePlanejamentoService : BackgroundService
    {
        private readonly ILogger<LembretePlanejamentoService> _logger;
        private readonly IServiceProvider _serviceProvider;

        // Intervalo padrão: a cada 24 horas. Pode ser configurável via IConfiguration.
        private readonly TimeSpan _interval = TimeSpan.FromHours(24);

        public LembretePlanejamentoService(
            ILogger<LembretePlanejamentoService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[LembretePlanejamento] Serviço de lembretes iniciado.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessarLembretesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[LembretePlanejamento] Erro ao processar lembretes.");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }

        private async Task ProcessarLembretesAsync(CancellationToken cancellationToken)
        {
            // Usar um scope transiente para acessar repositórios (que são Scoped)
            using var scope = _serviceProvider.CreateScope();
            var usuarioRepo = scope.ServiceProvider.GetRequiredService<IUsuarioRepository>();
            var planejamentoRepo = scope.ServiceProvider.GetRequiredService<IPlanejamentoRepository>();

            // Em produção: buscar usuários com planejamento ativo e que não atualizaram há X dias
            // Para fins de demonstração, logamos uma mensagem estruturada que poderia disparar e-mails
            _logger.LogInformation("[LembretePlanejamento] Verificando planejamentos com lembretes pendentes em {Now}.", DateTime.UtcNow);

            // Simulação: log de "e-mail" que seria enviado
            // Em produção, aqui seria feito algo como:
            // var usuariosAtivos = await usuarioRepo.GetAtivosComPlanejamentoSemAtualizacaoRecenteAsync(diasSemAtualizacao: 7);
            // foreach (var usuario in usuariosAtivos)
            // {
            //     await emailService.SendAsync(usuario.Email, "Lembrete do seu Planejamento", ...);
            // }

            _logger.LogInformation("[LembretePlanejamento] [SIMULAÇÃO] Ciclo de lembretes concluído. Próxima execução em {Next}.", DateTime.UtcNow.Add(_interval));
        }
    }
}
