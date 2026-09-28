using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace ImovPlan.API.Services
{
    public class DraftSaveWorker : BackgroundService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DraftSaveWorker> _logger;
        private const string QueueName = "draft_updates_queue";

        public DraftSaveWorker(IConnectionMultiplexer redis, IServiceScopeFactory scopeFactory, ILogger<DraftSaveWorker> logger)
        {
            _redis = redis;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DraftSaveWorker iniciado. Escutando fila {QueueName}", QueueName);
            var db = _redis.GetDatabase();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Usa BLPOP equivalente ou delay
                    var result = await db.ListRightPopLeftPushAsync(QueueName, QueueName + "_processing");
                    
                    if (!result.HasValue)
                    {
                        await Task.Delay(1000, stoppingToken);
                        continue;
                    }

                    var messageStr = result.ToString();
                    var message = JsonSerializer.Deserialize<DraftUpdateMessage>(messageStr);

                    if (message != null)
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var planoService = scope.ServiceProvider.GetRequiredService<IPlanoService>();

                        await planoService.UpdateDraftAsync(message.PlanId, message.DraftDto, message.UsuarioId);
                        _logger.LogInformation("Draft {PlanId} atualizado com sucesso via Redis worker", message.PlanId);
                    }

                    // Remove da processing queue
                    await db.ListRemoveAsync(QueueName + "_processing", result);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro no DraftSaveWorker ao processar mensagem do Redis");
                    await Task.Delay(5000, stoppingToken); // delay before retry
                }
            }
        }
    }

    public class DraftUpdateMessage
    {
        public string PlanId { get; set; } = string.Empty;
        public string UsuarioId { get; set; } = string.Empty;
        public PlanoDraftDto DraftDto { get; set; } = new();
    }
}
