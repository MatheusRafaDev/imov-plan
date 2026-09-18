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
                // 1. Participantes (PlanejamentoId)
                var participantesCollection = database.GetCollection<BsonDocument>("participantes");
                await participantesCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("PlanejamentoId")),
                    cancellationToken: cancellationToken);

                // 2. AportesExtras (PlanejamentoId)
                var aportesExtrasCollection = database.GetCollection<BsonDocument>("aportesExtras");
                await aportesExtrasCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("PlanejamentoId")),
                    cancellationToken: cancellationToken);

                // 3. HistoricoSimulacoes (PlanejamentoId)
                var histSimulacoesCollection = database.GetCollection<BsonDocument>("historicoSimulacoes");
                await histSimulacoesCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("PlanejamentoId")),
                    cancellationToken: cancellationToken);

                // 4. EvolucaoMensalSimulacoes (SimulacaoId)
                var evolucaoCollection = database.GetCollection<BsonDocument>("evolucaoMensalSimulacoes");
                await evolucaoCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("SimulacaoId")),
                    cancellationToken: cancellationToken);

                // 5. Planejamentos (UsuarioId)
                var planejamentosCollection = database.GetCollection<BsonDocument>("planejamentos");
                await planejamentosCollection.Indexes.CreateManyAsync(new[]
                {
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("UsuarioId")),
                    new CreateIndexModel<BsonDocument>(Builders<BsonDocument>.IndexKeys.Ascending("SessionId"))
                }, cancellationToken: cancellationToken);

                // 6. HistoricoAportes (PlanejamentoId + ParticipanteId + Mes)
                var historicoAportesCollection = database.GetCollection<BsonDocument>("historicoAportes");
                await historicoAportesCollection.Indexes.CreateOneAsync(
                    new CreateIndexModel<BsonDocument>(
                        Builders<BsonDocument>.IndexKeys
                            .Ascending("PlanejamentoId")
                            .Ascending("ParticipanteId")
                            .Ascending("Mes")
                    ), cancellationToken: cancellationToken);

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
