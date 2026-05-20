using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using ImovPlan.Infrastructure.Data;
using ImovPlan.Infrastructure.Configurations;
using ImovPlan.Infrastructure.Repositories;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services;
using ImovPlan.Application.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Vite/React default ports
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Configure MongoDB
var mongoSettings = new MongoDbSettings();
builder.Configuration.GetSection("MongoDbSettings").Bind(mongoSettings);

// Create MongoClient explicitly to ensure proper connection for EF Core MongoDB
var mongoClient = new MongoClient(mongoSettings.ConnectionString);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMongoDB(mongoClient, mongoSettings.DatabaseName)
);

// Register Repositories
builder.Services.AddScoped<IPessoaRepository, PessoaRepository>();
builder.Services.AddScoped<IObjetivoRepository, ObjetivoRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

// Register Services
builder.Services.AddScoped<ICalculoFinanceiroService, CalculoFinanceiroService>();
builder.Services.AddScoped<ISimulacaoService, SimulacaoService>();
builder.Services.AddScoped<IFinanciamentoService, FinanciamentoService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
