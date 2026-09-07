using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MongoDB.Driver;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class HistoricoSimulacaoRepository : IHistoricoSimulacaoRepository
    {
        private readonly AppDbContext _context;

        public HistoricoSimulacaoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<HistoricoSimulacao?> GetUltimoByPlanejamentoIdAsync(string planejamentoId)
        {
            return await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .OrderByDescending(s => s.GeradoEm)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<HistoricoSimulacao>> GetAllByPlanejamentoIdAsync(string planejamentoId)
        {
            return await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .OrderByDescending(s => s.GeradoEm)
                .ToListAsync();
        }

        public async Task<HistoricoSimulacao> AddAsync(HistoricoSimulacao registro)
        {
            _context.HistoricosSimulacao.Add(registro);
            await _context.SaveChangesAsync();
            return registro;
        }

        public async Task<IEnumerable<EvolucaoMensalSimulacao>> GetEvolucaoBySimulacaoIdAsync(string simulacaoId)
        {
            return await _context.EvolucoesMensaisSimulacao
                .Where(e => e.SimulacaoId == simulacaoId)
                .OrderBy(e => e.Mes)
                .ToListAsync();
        }

        public async Task DeleteAsync(string id)
        {
            var mongoClient = _context.GetService<MongoDB.Driver.IMongoClient>();
            var config = _context.GetService<Microsoft.Extensions.Configuration.IConfiguration>();
            var dbName = config["MongoDbSettings:DatabaseName"];
            if (string.IsNullOrEmpty(dbName)) return;

            var db = mongoClient.GetDatabase(dbName);
            var historicosColl = db.GetCollection<HistoricoSimulacao>("HistoricosSimulacao");
            var evolucoesColl = db.GetCollection<EvolucaoMensalSimulacao>("EvolucoesMensaisSimulacao");

            // Delete evolutions
            var filterEvolucoes = MongoDB.Driver.Builders<EvolucaoMensalSimulacao>.Filter.Eq(e => e.SimulacaoId, id);
            await evolucoesColl.DeleteManyAsync(filterEvolucoes);

            // Delete simulation
            var filterHistorico = MongoDB.Driver.Builders<HistoricoSimulacao>.Filter.Eq(s => s.Id, id);
            await historicosColl.DeleteOneAsync(filterHistorico);

            // Clear tracker
            _context.ChangeTracker.Clear();
        }

        public async Task DeleteAllByPlanejamentoIdAsync(string planejamentoId)
        {
            var mongoClient = _context.GetService<MongoDB.Driver.IMongoClient>();
            var config = _context.GetService<Microsoft.Extensions.Configuration.IConfiguration>();
            var dbName = config["MongoDbSettings:DatabaseName"];
            if (string.IsNullOrEmpty(dbName)) return;

            var db = mongoClient.GetDatabase(dbName);
            var historicosColl = db.GetCollection<HistoricoSimulacao>("HistoricosSimulacao");
            var evolucoesColl = db.GetCollection<EvolucaoMensalSimulacao>("EvolucoesMensaisSimulacao");

            // Find all simulation IDs for this plan
            var filterHistoricos = MongoDB.Driver.Builders<HistoricoSimulacao>.Filter.Eq(s => s.PlanejamentoId, planejamentoId);
            var projection = MongoDB.Driver.Builders<HistoricoSimulacao>.Projection.Expression(s => s.Id);
            var simIds = await historicosColl.Find(filterHistoricos).Project(projection).ToListAsync();

            if (!simIds.Any()) return;

            // Delete all evolutions for these simulation IDs in one go
            var filterEvolucoes = MongoDB.Driver.Builders<EvolucaoMensalSimulacao>.Filter.In(e => e.SimulacaoId, simIds);
            await evolucoesColl.DeleteManyAsync(filterEvolucoes);

            // Delete the simulations
            await historicosColl.DeleteManyAsync(filterHistoricos);

            // Clear tracker so EF doesn't get confused
            _context.ChangeTracker.Clear();
        }

        public async Task AddEvolucaoAsync(IEnumerable<EvolucaoMensalSimulacao> evolucao)
        {
            await _context.EvolucoesMensaisSimulacao.AddRangeAsync(evolucao);
            await _context.SaveChangesAsync();
        }
    }
}
