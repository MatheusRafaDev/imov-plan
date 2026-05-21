// Program.cs - API with auto-restart on unhandled exceptions
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
using System.Threading;

while (true)
{
    var builder = WebApplication.CreateBuilder(args);

    // Load .env file from the backend root (try multiple paths)
    try
    {
        var envPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".env");
        if (File.Exists(envPath))
            DotNetEnv.Env.Load(envPath);
        else if (File.Exists("../../../.env"))
            DotNetEnv.Env.Load("../../../.env");
        else if (File.Exists("../../.env"))
            DotNetEnv.Env.Load("../../.env");
        else if (File.Exists("../.env"))
            DotNetEnv.Env.Load("../.env");
    }
    catch { /* .env not found, continue with appsettings */ }
    builder.Configuration.AddEnvironmentVariables();

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    // Configure CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });

    // Configure MongoDB
    var mongoSettings = new MongoDbSettings();
    builder.Configuration.GetSection("MongoDbSettings").Bind(mongoSettings);
    var mongoClient = new MongoClient(mongoSettings.ConnectionString);
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseMongoDB(mongoClient, mongoSettings.DatabaseName));

    // Register Repositories
    builder.Services.AddScoped<IPessoaRepository, PessoaRepository>();
    builder.Services.AddScoped<IObjetivoRepository, ObjetivoRepository>();
    builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

    // Register Services
    builder.Services.AddScoped<ICalculoFinanceiroService, CalculoFinanceiroService>();
    builder.Services.AddScoped<ISimulacaoService, SimulacaoService>();
    builder.Services.AddScoped<IFinanciamentoService, FinanciamentoService>();
    builder.Services.AddScoped<IPlanoService, PlanoService>();
    builder.Services.AddHttpClient<IAiConsultingService, ImovPlan.Infrastructure.Services.GroqAiService>();

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

    try
    {
        app.Run();
        break; // Normal exit
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Unhandled exception: {ex.Message}\nRestarting API...");
        Thread.Sleep(2000); // small delay before restart
    }
}
