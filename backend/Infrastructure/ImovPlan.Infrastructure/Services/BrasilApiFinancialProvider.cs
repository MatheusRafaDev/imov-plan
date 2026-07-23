using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace ImovPlan.Infrastructure.Services
{
    public class BrasilApiFinancialProvider : IFinancialRatesProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BrasilApiFinancialProvider> _logger;

        public BrasilApiFinancialProvider(HttpClient httpClient, ILogger<BrasilApiFinancialProvider> logger)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("https://brasilapi.com.br/api/");
            _logger = logger;
        }

        private async Task<decimal> GetTaxaAsync(string nome)
        {
            try
            {
                var response = await _httpClient.GetAsync("taxas/v1");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var taxas = JsonSerializer.Deserialize<List<TaxaBrasilApiDto>>(content, options);

                var taxa = taxas?.FirstOrDefault(t => string.Equals(t.Nome, nome, StringComparison.OrdinalIgnoreCase));
                return taxa?.Valor ?? 0m;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar taxa {Nome} da Brasil API", nome);
                return 0m;
            }
        }

        public Task<decimal> GetCurrentSelicAsync() => GetTaxaAsync("Selic");

        public Task<decimal> GetCurrentCdiAsync() => GetTaxaAsync("CDI");

        public Task<decimal> GetCurrentIpcaAsync() => GetTaxaAsync("IPCA");
    }

    public class TaxaBrasilApiDto
    {
        public string Nome { get; set; } = string.Empty;
        public decimal Valor { get; set; }
    }
}
