using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        // Existing collections
        public DbSet<Pessoa> Pessoas { get; init; }
        public DbSet<ObjetivoImovel> Objetivos { get; init; }
        public DbSet<Usuario> Usuarios { get; init; }

        // New collections
        public DbSet<CustosImovel> CustosImoveis { get; init; }
        public DbSet<SaldoInicial> SaldosIniciais { get; init; }
        public DbSet<AporteRegularEdit> AportesRegularesEdits { get; init; }
        public DbSet<AporteExtra> AportesExtras { get; init; }
        public DbSet<GastoDetalhado> GastosDetalhados { get; init; }
        public DbSet<RegistroSimulacao> RegistrosSimulacao { get; init; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
            Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Existing mappings
            modelBuilder.Entity<Pessoa>().ToCollection("pessoas");
            modelBuilder.Entity<ObjetivoImovel>().ToCollection("objetivos");
            modelBuilder.Entity<Usuario>().ToCollection("usuarios");

            // New collection mappings
            modelBuilder.Entity<CustosImovel>().ToCollection("custosImoveis");
            modelBuilder.Entity<SaldoInicial>().ToCollection("saldosIniciais");
            modelBuilder.Entity<AporteRegularEdit>().ToCollection("aportesRegularesEdits");
            modelBuilder.Entity<AporteExtra>().ToCollection("aportesExtras");
            modelBuilder.Entity<GastoDetalhado>().ToCollection("gastosDetalhados");
            modelBuilder.Entity<RegistroSimulacao>().ToCollection("registrosSimulacao");

            // Indexes for frequently queried collections
            modelBuilder.Entity<Pessoa>()
                .HasIndex(p => p.ObjetivoImovelId);

            modelBuilder.Entity<SaldoInicial>()
                .HasIndex(s => s.PessoaId);

            modelBuilder.Entity<AporteExtra>()
                .HasIndex(a => a.ObjetivoImovelId);

            modelBuilder.Entity<AporteRegularEdit>()
                .HasIndex(a => new { a.ObjetivoImovelId, a.PessoaId, a.Mes });

            modelBuilder.Entity<ObjetivoImovel>()
                .HasIndex(o => o.SessionId);

            modelBuilder.Entity<ObjetivoImovel>()
                .HasIndex(o => o.UsuarioId);
        }
    }
}
