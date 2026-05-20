using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<Pessoa> Pessoas { get; init; }
        public DbSet<ObjetivoImovel> Objetivos { get; init; }
        public DbSet<Usuario> Usuarios { get; init; }

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Pessoa>().ToCollection("pessoas");
            modelBuilder.Entity<ObjetivoImovel>().ToCollection("objetivos");
            modelBuilder.Entity<Usuario>().ToCollection("usuarios");
        }
    }
}
