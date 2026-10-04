using MongoDB.Driver;
using MongoDB.Bson;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Threading;
using System.Threading.Tasks;
using ImovPlan.Infrastructure.Configurations;
using System;
using System.Collections.Generic;

namespace ImovPlan.API.Services
{
    public class MongoDbIndexInitializer : IHostedService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MongoDbIndexInitializer> _logger;

        public MongoDbIndexInitializer(IServiceProvider serviceProvider, ILogger<MongoDbIndexInitializer> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Verificando/criando índices no MongoDB para performance...");
            
            using var scope = _serviceProvider.CreateScope();
            var mongoClient = scope.ServiceProvider.GetRequiredService<IMongoClient>();
            var settings = scope.ServiceProvider.GetRequiredService<MongoDbSettings>();

            var database = mongoClient.GetDatabase(settings.DatabaseName);

            try
            {
                // 1. Participantes (planejamentoId)
                var participantesCollection = database.GetCollection<BsonDocument>("participantes");
                await participantesCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("planejamentoId")),
                    cancellationToken: cancellationToken);

                // 2. AportesExtras (planejamentoId)
                var aportesExtrasCollection = database.GetCollection<BsonDocument>("aportesExtras");
                await aportesExtrasCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("planejamentoId")),
                    cancellationToken: cancellationToken);

                // 3. HistoricoSimulacoes (planejamentoId)
                var histSimulacoesCollection = database.GetCollection<BsonDocument>("historicoSimulacoes");
                await histSimulacoesCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("planejamentoId")),
                    cancellationToken: cancellationToken);

                // 4. EvolucaoMensalSimulacoes (simulacaoId)
                var evolucaoCollection = database.GetCollection<BsonDocument>("evolucaoMensalSimulacoes");
                await evolucaoCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("simulacaoId")),
                    cancellationToken: cancellationToken);

                // 5. Planejamentos (usuarioId)
                var planejamentosCollection = database.GetCollection<BsonDocument>("planejamentos");
                await planejamentosCollection.Indexes.CreateManyAsync(new[]
                {
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("usuarioId")),
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("sessionId"))
                }, cancellationToken: cancellationToken);

                // 6. HistoricoAportes (planejamentoId + participanteId + mes)
                var historicoAportesCollection = database.GetCollection<BsonDocument>("historicoAportes");
                await historicoAportesCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(
                        Builders<BsonDocument>.IndexKeys
                            .Ascending("planejamentoId")
                            .Ascending("participanteId")
                            .Ascending("mes")
                    ), cancellationToken: cancellationToken);

                // 7. Usuarios (email)
                var usuariosCollection = database.GetCollection<BsonDocument>("usuarios");
                await usuariosCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(
                        Builders<BsonDocument>.IndexKeys.Ascending("email"),
                        new CreateIndexOptions { Unique = true, Sparse = true }
                    ), cancellationToken: cancellationToken);

                // 8. ParametrosFinanceiros (codigo)
                var parametrosCollection = database.GetCollection<BsonDocument>("parametrosFinanceiros");
                await parametrosCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(
                        Builders<BsonDocument>.IndexKeys.Ascending("codigo")
                    ), cancellationToken: cancellationToken);

                // 9. GastosDetalhados (planejamentoId, participanteId)
                var gastosCollection = database.GetCollection<BsonDocument>("gastosDetalhados");
                await gastosCollection.Indexes.CreateManyAsync(new[]
                {
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("planejamentoId")),
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("participanteId"))
                }, cancellationToken: cancellationToken);

                _logger.LogInformation("Índices criados com sucesso.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar índices no MongoDB. A performance das consultas pode ser afetada.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
