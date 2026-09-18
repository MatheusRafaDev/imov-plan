using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace ImovPlan.API.Services
{
    public class KeepAliveService : BackgroundService
    {
        private readonly ILogger<KeepAliveService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string? _selfUrl;

        public KeepAliveService(ILogger<KeepAliveService> logger, IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _selfUrl = configuration["KEEP_ALIVE_URL"] ?? configuration["ASPNETCORE_URLS"]?.Split(';')[0];
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (string.IsNullOrEmpty(_selfUrl))
            {
                _logger.LogWarning("KEEP_ALIVE_URL is not configured. KeepAliveService will not ping.");
                return;
            }

            _logger.LogInformation("KeepAliveService is starting. Pinging {Url} every 10 minutes.", _selfUrl);

            // Dispara a cada 10 minutos (Render dorme após 15 min de inatividade)
            using var timer = new PeriodicTimer(TimeSpan.FromMinutes(10));

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    var pingUrl = _selfUrl.TrimEnd('/') + "/health";
                    _logger.LogInformation("Pinging {Url} to keep the application alive...", pingUrl);
                    
                    var client = _httpClientFactory.CreateClient("KeepAlive");
                    var response = await client.GetAsync(pingUrl, stoppingToken);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Keep alive ping successful.");
                    }
                    else
                    {
                        _logger.LogWarning("Keep alive ping failed with status code {StatusCode}.", response.StatusCode);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while pinging to keep alive.");
                }
            }
        }
    }
}
