using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        // Core collections
        public DbSet<Participante> Participantes { get; init; }
        public DbSet<Planejamento> Planejamentos { get; init; }
        public DbSet<Usuario> Usuarios { get; init; }

        // Related collections
        public DbSet<AporteExtra> AportesExtras { get; init; }
        public DbSet<GastoDetalhado> GastosDetalhados { get; init; }
        public DbSet<HistoricoAporte> HistoricosAportes { get; init; }
        public DbSet<HistoricoSimulacao> HistoricosSimulacao { get; init; }
        public DbSet<EvolucaoMensalSimulacao> EvolucoesMensaisSimulacao { get; init; }
        public DbSet<ParametrosFinanceiros> ParametrosFinanceiros { get; init; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
            Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Core collection mappings
            modelBuilder.Entity<Participante>().ToCollection("participantes");
            modelBuilder.Entity<Planejamento>().ToCollection("planejamentos");
            modelBuilder.Entity<Usuario>().ToCollection("usuarios");

            // Related collection mappings
            modelBuilder.Entity<AporteExtra>().ToCollection("aportesExtras");
            modelBuilder.Entity<GastoDetalhado>().ToCollection("gastosDetalhados");
            modelBuilder.Entity<HistoricoAporte>().ToCollection("historicoAportes");
            modelBuilder.Entity<HistoricoSimulacao>().ToCollection("historicoSimulacoes");
            modelBuilder.Entity<EvolucaoMensalSimulacao>().ToCollection("evolucaoMensalSimulacoes");
            modelBuilder.Entity<ParametrosFinanceiros>().ToCollection("parametrosFinanceiros");

            // Owned entity mappings
            modelBuilder.Entity<Planejamento>().OwnsOne(p => p.CustosCompra);
            modelBuilder.Entity<Participante>().OwnsOne(p => p.PatrimonioInicial);
            modelBuilder.Entity<HistoricoSimulacao>().OwnsMany(h => h.ParticipantesSnapshot);
            modelBuilder.Entity<EvolucaoMensalSimulacao>().OwnsMany(e => e.Participantes);

            // Indexes for frequently queried collections
            modelBuilder.Entity<Participante>()
                .HasIndex(p => p.PlanejamentoId);

            modelBuilder.Entity<AporteExtra>()
                .HasIndex(a => a.PlanejamentoId);

            modelBuilder.Entity<HistoricoAporte>()
                .HasIndex(a => new { a.PlanejamentoId, a.ParticipanteId, a.Mes });

            modelBuilder.Entity<Planejamento>()
                .HasIndex(o => o.SessionId);

            modelBuilder.Entity<Planejamento>()
                .HasIndex(o => o.UsuarioId);

            modelBuilder.Entity<HistoricoSimulacao>()
                .HasIndex(s => s.PlanejamentoId);

            modelBuilder.Entity<EvolucaoMensalSimulacao>()
                .HasIndex(e => e.SimulacaoId);

            modelBuilder.Entity<ParametrosFinanceiros>()
                .HasIndex(p => p.Codigo);
        }
    }
}
