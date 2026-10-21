using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Configurations;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class HistoricoSimulacaoRepository : IHistoricoSimulacaoRepository
    {
        private readonly AppDbContext _context;
        private readonly IMongoCollection<HistoricoSimulacao>? _historicosColl;
        private readonly IMongoCollection<EvolucaoMensalSimulacao>? _evolucoesColl;

        public HistoricoSimulacaoRepository(
            AppDbContext context,
            IMongoClient? mongoClient = null,
            MongoDbSettings? mongoSettings = null,
            IConfiguration? configuration = null)
        {
            _context = context;

            if (mongoClient != null)
            {
                var dbName = configuration?["MONGO_DATABASE_NAME"]
                    ?? mongoSettings?.DatabaseName
                    ?? configuration?["MongoDbSettings:DatabaseName"]
                    ?? "ImovPlanDb";

                var db = mongoClient.GetDatabase(dbName);
                _historicosColl = db.GetCollection<HistoricoSimulacao>("historicoSimulacoes");
                _evolucoesColl = db.GetCollection<EvolucaoMensalSimulacao>("evolucaoMensalSimulacoes");
            }
        }

        public async Task<HistoricoSimulacao?> GetUltimoByPlanejamentoIdAsync(string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId) || !MongoDB.Bson.ObjectId.TryParse(planejamentoId, out _))
                return null;

            if (_historicosColl != null)
            {
                var filter = Builders<HistoricoSimulacao>.Filter.Eq(s => s.PlanejamentoId, planejamentoId);
                return await _historicosColl.Find(filter)
                    .SortByDescending(s => s.GeradoEm)
                    .FirstOrDefaultAsync();
            }

            return await _context.HistoricosSimulacao
                .AsNoTracking()
                .Where(s => s.PlanejamentoId == planejamentoId)
                .OrderByDescending(s => s.GeradoEm)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<HistoricoSimulacao>> GetAllByPlanejamentoIdAsync(string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId) || !MongoDB.Bson.ObjectId.TryParse(planejamentoId, out _))
                return Enumerable.Empty<HistoricoSimulacao>();

            if (_historicosColl != null)
            {
                var filter = Builders<HistoricoSimulacao>.Filter.Eq(s => s.PlanejamentoId, planejamentoId);
                return await _historicosColl.Find(filter)
                    .SortByDescending(s => s.GeradoEm)
                    .ToListAsync();
            }

            return await _context.HistoricosSimulacao
                .AsNoTracking()
                .Where(s => s.PlanejamentoId == planejamentoId)
                .OrderByDescending(s => s.GeradoEm)
                .ToListAsync();
        }

        public async Task<HistoricoSimulacao> AddAsync(HistoricoSimulacao registro)
        {
            if (_historicosColl != null)
            {
                await _historicosColl.InsertOneAsync(registro);
                return registro;
            }

            _context.HistoricosSimulacao.Add(registro);
            await _context.SaveChangesAsync();
            return registro;
        }

        public async Task<IEnumerable<EvolucaoMensalSimulacao>> GetEvolucaoBySimulacaoIdAsync(string simulacaoId)
        {
            if (string.IsNullOrEmpty(simulacaoId) || !MongoDB.Bson.ObjectId.TryParse(simulacaoId, out _) || _evolucoesColl == null)
                return new List<EvolucaoMensalSimulacao>();

            var filter = Builders<EvolucaoMensalSimulacao>.Filter.Eq(e => e.SimulacaoId, simulacaoId);
            return await _evolucoesColl.Find(filter).SortBy(e => e.Mes).ToListAsync();
        }

        public async Task DeleteAsync(string id)
        {
            if (string.IsNullOrEmpty(id) || !MongoDB.Bson.ObjectId.TryParse(id, out _))
                return;

            if (_evolucoesColl != null && _historicosColl != null)
            {
                var filterEvolucoes = Builders<EvolucaoMensalSimulacao>.Filter.Eq(e => e.SimulacaoId, id);
                await _evolucoesColl.DeleteManyAsync(filterEvolucoes);

                var filterHistorico = Builders<HistoricoSimulacao>.Filter.Eq(s => s.Id, id);
                await _historicosColl.DeleteOneAsync(filterHistorico);
            }
            else
            {
                var existing = await _context.HistoricosSimulacao.FirstOrDefaultAsync(s => s.Id == id);
                if (existing != null)
                {
                    _context.HistoricosSimulacao.Remove(existing);
                    await _context.SaveChangesAsync();
                }
            }

            _context.ChangeTracker.Clear();
        }

        public async Task DeleteAllByPlanejamentoIdAsync(string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId) || !MongoDB.Bson.ObjectId.TryParse(planejamentoId, out _))
                return;

            if (_historicosColl != null && _evolucoesColl != null)
            {
                var filterHistoricos = Builders<HistoricoSimulacao>.Filter.Eq(s => s.PlanejamentoId, planejamentoId);
                var projection = Builders<HistoricoSimulacao>.Projection.Expression(s => s.Id);
                var simIds = await _historicosColl.Find(filterHistoricos).Project(projection).ToListAsync();

                if (!simIds.Any()) return;

                var filterEvolucoes = Builders<EvolucaoMensalSimulacao>.Filter.In(e => e.SimulacaoId, simIds);
                await _evolucoesColl.DeleteManyAsync(filterEvolucoes);
                await _historicosColl.DeleteManyAsync(filterHistoricos);
            }

            _context.ChangeTracker.Clear();
        }

        public async Task AddEvolucaoAsync(IEnumerable<EvolucaoMensalSimulacao> evolucao)
        {
            if (!evolucao.Any() || _evolucoesColl == null) return;

            await _evolucoesColl.InsertManyAsync(evolucao);
            _context.ChangeTracker.Clear();
        }
    }
}
