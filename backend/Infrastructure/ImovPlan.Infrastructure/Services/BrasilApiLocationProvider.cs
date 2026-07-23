using System;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ImovPlan.Application.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace ImovPlan.Infrastructure.Services
{
    public class BrasilApiLocationProvider : ILocationProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BrasilApiLocationProvider> _logger;

        public BrasilApiLocationProvider(HttpClient httpClient, ILogger<BrasilApiLocationProvider> logger)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("https://brasilapi.com.br/api/");
            _logger = logger;
        }

        public async Task<AddressDto?> GetAddressByCepAsync(string cep)
        {
            try
            {
                var cleanCep = Regex.Replace(cep, @"\D", "");
                if (cleanCep.Length != 8)
                {
                    return null;
                }

                var response = await _httpClient.GetAsync($"cep/v1/{cleanCep}");
                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                var content = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var result = JsonSerializer.Deserialize<BrasilApiCepDto>(content, options);

                if (result == null) return null;

                return new AddressDto
                {
                    Cep = result.Cep,
                    Street = result.Street,
                    Neighborhood = result.Neighborhood,
                    City = result.City,
                    State = result.State
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar CEP {Cep} na Brasil API", cep);
                return null;
            }
        }
    }

    public class BrasilApiCepDto
    {
        public string Cep { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Neighborhood { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
    }
}
