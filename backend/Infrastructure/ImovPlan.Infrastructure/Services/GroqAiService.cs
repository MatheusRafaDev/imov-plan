using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Interfaces;
using System.Linq;

namespace ImovPlan.Infrastructure.Services
{
    public class GroqAiService : IAiConsultingService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly IFinanciamentoService _financiamentoService;
        private readonly IParametrosFinanceirosRepository _parametrosRepo;

        public GroqAiService(HttpClient httpClient, IConfiguration configuration, IFinanciamentoService financiamentoService, IParametrosFinanceirosRepository parametrosRepo)
        {
            _httpClient = httpClient;
            _financiamentoService = financiamentoService;
            _parametrosRepo = parametrosRepo;

            // Tenta pegar do appsettings (GroqConfig:ApiKey) ou da variável de ambiente GROQ_API_KEY do .env
            _apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY")
                      ?? configuration["GroqConfig:ApiKey"]
                      ?? "";

            if (string.IsNullOrEmpty(_apiKey) || _apiKey == "mock-key" || _apiKey.Contains("cole_sua_chave_aqui"))
            {
                _apiKey = "mock";
            }
            else
            {
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            }
        }

        // ─── Payload builder ──────────────────────────────────────────────────────

        private async Task<object> BuildPayloadAsync(ConsultoriaRequestDto request, bool stream)
        {
            var parametros = await _parametrosRepo.GetAtivoAsync();
            object? simulacoes = null;
            decimal limiteParcela = request.Renda_Total_Bruta * parametros.LimiteComprometimentoRenda;
            decimal taxaMCMV = parametros.TaxaMcmvAnualPadrao;
            decimal taxaSBPE = parametros.TaxaSbpeAnualPadrao;
            decimal taxaAplicada = request.Renda_Total_Bruta <= 9600 ? taxaMCMV : taxaSBPE;

            if (request.Imovel != null && (request.Imovel.ValorImovel ?? 0m) > 0 && (request.Imovel.PrazoMaxMeses ?? 0) > 0)
            {
                var valorEntrada = (request.Imovel.ValorImovel ?? 0m) * ((request.Imovel.PercentualEntrada ?? 0m) / 100m);
                var valorFinanciado = (request.Imovel.ValorImovel ?? 0m) - valorEntrada;
                if (valorFinanciado > 0)
                {
                    simulacoes = _financiamentoService.CompararSistemas(valorFinanciado, taxaAplicada, request.Imovel.PrazoMaxMeses ?? 0);
                }
            }

            var contextData = new
            {
                Perfil = request,
                AnaliseFinanceira = new
                {
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

            return new
            {
                model = "llama-3.3-70b-versatile",
                messages = new[] { new { role = "system", content = systemPrompt } },
                temperature = 0.4,
                stream
            };
        }

        // ─── Non-streaming (mantido para compatibilidade) ─────────────────────────

        public async Task<string> GetConsultoriaAsync(ConsultoriaRequestDto request)
        {
            if (_apiKey == "mock") return GetMockResponse();

            try
            {
                _httpClient.Timeout = TimeSpan.FromSeconds(30);
                var payload = await BuildPayloadAsync(request, stream: false);
                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);

                if (!response.IsSuccessStatusCode) return GetMockResponse();

                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                return doc.RootElement
                          .GetProperty("choices")[0]
                          .GetProperty("message")
                          .GetProperty("content")
                          .GetString() ?? string.Empty;
            }
            catch
            {
                return GetMockResponse();
            }
        }

        public async Task<string> GetAvaliacaoRegiaoAsync(string prompt)
        {
            if (_apiKey == "mock") return "Avaliando pelo Mock: Essa região apresenta uma infraestrutura básica com alguns comércios ao redor. Excelente opção para quem busca conveniência no dia a dia.";

            var payload = new
            {
                model = "llama-3.3-70b-versatile",
                messages = new[] { new { role = "user", content = prompt } },
                temperature = 0.4
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            try
            {
                var response = await _httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);
                if (!response.IsSuccessStatusCode) return "Não foi possível avaliar a região no momento (API indisponível).";

                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                return doc.RootElement
                          .GetProperty("choices")[0]
                          .GetProperty("message")
                          .GetProperty("content")
                          .GetString() ?? string.Empty;
            }
            catch
            {
                return "Não foi possível avaliar a região no momento (Erro de conexão).";
            }
        }

        // ─── Streaming via SSE ────────────────────────────────────────────────────

        public async IAsyncEnumerable<string> GetConsultoriaStreamAsync(
            ConsultoriaRequestDto request,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            if (_apiKey == "mock")
            {
                // Mock: entrega o fallback em chunks simulados
                foreach (var chunk in GetMockResponse().Split(' '))
                {
                    if (cancellationToken.IsCancellationRequested) yield break;
                    yield return chunk + " ";
                    await Task.Delay(30, cancellationToken).ConfigureAwait(false);
                }
                yield break;
            }

            HttpResponseMessage? response = null;
            bool hasError = false;
            try
            {
                var payload = await BuildPayloadAsync(request, stream: true);
                var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };

                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(60));

                response = await _httpClient.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead, cts.Token);
            }
            catch
            {
                hasError = true;
            }

            if (hasError || response == null || !response.IsSuccessStatusCode)
            {
                foreach (var chunk in GetMockResponse().Split(' '))
                {
                    if (cancellationToken.IsCancellationRequested) yield break;
                    yield return chunk + " ";
                }
                yield break;
            }

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(cancellationToken);
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (!line.StartsWith("data: ")) continue;

                var data = line["data: ".Length..];
                if (data == "[DONE]") break;

                string? delta = null;
                try
                {
                    using var doc = JsonDocument.Parse(data);
                    var choices = doc.RootElement.GetProperty("choices");
                    if (choices.GetArrayLength() == 0) continue;
                    var deltaEl = choices[0].GetProperty("delta");
                    if (deltaEl.TryGetProperty("content", out var contentEl))
                        delta = contentEl.GetString();
                }
                catch { continue; }

                if (!string.IsNullOrEmpty(delta))
                    yield return delta;
            }
        }

        private string GetMockResponse()
        {
            return @"### Análise do seu Perfil (Modo Simulação .NET)

⚠️ *Aviso: Conexão com a IA indisponível no momento ou API Key não configurada.*

Com base na renda total familiar informada, eis a sua projeção simulada pelo Backend:

**1. Enquadramento Minha Casa Minha Vida**
Se sua renda for menor que R$ 9.600,00, você se enquadra no programa e pode usar seu FGTS.

**2. Recomendação de Banco**
Sugerimos priorizar o financiamento pela **Caixa Econômica Federal**.

*Dica: Tente novamente mais tarde ou verifique a configuração da API.*";
        }
    }
}
