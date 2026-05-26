using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;
using System.Linq;

namespace ImovPlan.Infrastructure.Services
{
    public class GroqAiService : IAiConsultingService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly IFinanciamentoService _financiamentoService;

        public GroqAiService(HttpClient httpClient, IConfiguration configuration, IFinanciamentoService financiamentoService)
        {
            _httpClient = httpClient;
            _financiamentoService = financiamentoService;
            
            // Tenta pegar do appsettings (GroqConfig:ApiKey) ou da variável de ambiente GROQ_API_KEY do .env
            _apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY") 
                      ?? configuration["GroqConfig:ApiKey"] 
                      ?? "";

            if (string.IsNullOrEmpty(_apiKey) || _apiKey == "mock-key" || _apiKey.Contains("cole_sua_chave_aqui"))
            {
                // Key ausente ou padrão
                _apiKey = "mock";
            }
            else
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            }
        }

        public async Task<string> GetConsultoriaAsync(ConsultoriaRequestDto request)
        {
            if (_apiKey == "mock")
            {
                return @"### Análise do seu Perfil (Modo Simulação .NET)

⚠️ *Aviso: Sua API Key do Groq ainda não foi configurada corretamente no Backend.*

Com base na renda total familiar informada, eis a sua projeção simulada pelo Backend:

**1. Enquadramento Minha Casa Minha Vida**
Se sua renda for menor que R$ 9.600,00, você se enquadra no programa e pode usar seu FGTS.

**2. Recomendação de Banco**
Sugerimos priorizar o financiamento pela **Caixa Econômica Federal**.

*Dica: Configure sua GROQ_API_KEY no arquivo .env do Backend e reinicie a API para obter a análise completa!*";
            }

            // Realizar simulação financeira real no backend para passar para a IA
            object simulacoes = null;
            decimal limiteParcela = request.Renda_Total_Bruta * 0.30m;
            decimal taxaMCMV = 8.16m;
            decimal taxaSBPE = 10.5m;
            decimal taxaAplicada = request.Renda_Total_Bruta <= 9600 ? taxaMCMV : taxaSBPE;

            if (request.Imovel != null && request.Imovel.ValorImovel > request.Imovel.ValorEntrada && request.Imovel.PrazoMaxMeses > 0)
            {
                var valorFinanciado = request.Imovel.ValorImovel - request.Imovel.ValorEntrada;
                simulacoes = _financiamentoService.CompararSistemas(valorFinanciado, taxaAplicada, request.Imovel.PrazoMaxMeses);
            }

            var contextData = new {
                Perfil = request,
                AnaliseFinanceira = new {
                    LimiteParcela30Porcento = limiteParcela,
                    TaxaJurosEstimada = taxaAplicada,
                    SimulacoesSAC_e_PRICE = simulacoes
                }
            };

            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var userDataString = JsonSerializer.Serialize(contextData, jsonOptions);

            var systemPrompt = @"
Você é um consultor financeiro de elite, especialista em financiamento imobiliário no Brasil (Minha Casa Minha Vida e Sistema SBPE).
Você recebeu os dados do usuário, incluindo uma simulação financeira REAL feita pelo nosso sistema (contendo as parcelas iniciais em SAC e PRICE).
Responda em Markdown, com uma formatação elegante, profissional e empática. Use tabelas, negrito e listas para facilitar a leitura. NÃO USE HTML. ATENÇÃO: TODOS os valores monetários informados na resposta DEVEM obrigatoriamente estar no formato brasileiro (exemplo: R$ 1.234,56). Da mesma forma, QUALQUER DATA informada deve estar no formato brasileiro (exemplo: DD/MM/AAAA).

Regras do Minha Casa Minha Vida (MCMV) 2024:
- Faixa 1: até R$ 3.200 (Melhores taxas, Caixa Econômica).
- Faixa 2: até R$ 5.000.
- Faixa 3: até R$ 9.600.
- Acima de R$ 9.600: SBPE (Qualquer banco: Itaú, Bradesco, Santander, Caixa. Taxas ~10 a 11%).
- O limite máximo de comprometimento de renda é 30% da renda bruta para a parcela.

Obrigatório no seu laudo:
1. Saudação inicial animadora.
2. Análise do Perfil: Confirme a renda, informe a Faixa (MCMV ou SBPE) e o valor máximo da parcela permitida (30% da renda).
3. Detalhamento do Financiamento: Explique o valor que será financiado. Extraia a PRIMEIRA PARCELA do sistema SAC e PRICE dos dados fornecidos e compare-as.
4. Bancos Recomendados: Sugira os melhores bancos para o perfil (ex: Caixa para MCMV; Itaú/Santander para SBPE com portabilidade de salário).
5. Ajuste de Rota (Plano de Ação): Se a primeira parcela do SAC for maior que o limite de 30% da renda, informe que o financiamento NÃO será aprovado nos moldes atuais. Sugira EXATAMENTE o que fazer (ex: aumentar a entrada para X, comprar um imóvel mais barato de valor Y, ou alongar o prazo se possível). Se estiver dentro dos 30%, parabenize e sugira dicas para juntar a entrada.

DADOS DO SISTEMA E DO USUÁRIO (JSON):
" + userDataString;

            var payload = new
            {
                model = "llama-3.3-70b-versatile",
                messages = new[]
                {
                    new { role = "system", content = systemPrompt }
                },
                temperature = 0.4
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Groq API Error: {response.StatusCode} - {errorMsg}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            var resultText = doc.RootElement
                                .GetProperty("choices")[0]
                                .GetProperty("message")
                                .GetProperty("content")
                                .GetString();

            return resultText ?? string.Empty;
        }
    }
}
