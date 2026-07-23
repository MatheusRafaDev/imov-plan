using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        // Core collections
        public virtual DbSet<Participante> Participantes { get; init; }
        public virtual DbSet<Planejamento> Planejamentos { get; init; }
        public virtual DbSet<Usuario> Usuarios { get; init; }

        // Related collections
        public virtual DbSet<AporteExtra> AportesExtras { get; init; }
        public virtual DbSet<GastoDetalhado> GastosDetalhados { get; init; }
        public virtual DbSet<HistoricoAporte> HistoricosAportes { get; init; }
        public virtual DbSet<HistoricoSimulacao> HistoricosSimulacao { get; init; }
        public virtual DbSet<EvolucaoMensalSimulacao> EvolucoesMensaisSimulacao { get; init; }
        public virtual DbSet<ParametrosFinanceiros> ParametrosFinanceiros { get; init; }
        public virtual DbSet<PontoInteresseCache> PontosInteresseCache { get; init; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
            if (Database != null)
            {
                Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            if (Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
            {
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
                modelBuilder.Entity<PontoInteresseCache>().ToCollection("pontosInteresseCache");
            }

            // Owned entity mappings
            modelBuilder.Entity<Planejamento>().OwnsOne(p => p.CustosCompra);
            modelBuilder.Entity<Participante>().OwnsOne(p => p.PatrimonioInicial);
            modelBuilder.Entity<HistoricoSimulacao>().OwnsMany(h => h.ParticipantesSnapshot);
            modelBuilder.Entity<EvolucaoMensalSimulacao>().OwnsMany(e => e.Participantes);
            modelBuilder.Entity<PontoInteresseCache>().OwnsMany(c => c.Resultados);

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
