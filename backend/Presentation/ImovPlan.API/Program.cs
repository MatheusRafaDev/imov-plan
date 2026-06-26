// Program.cs - API with auto-restart on unhandled exceptions
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MongoDB.Driver;
using ImovPlan.Infrastructure.Data;
using ImovPlan.Infrastructure.Configurations;
using ImovPlan.Infrastructure.Repositories;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services;
using ImovPlan.Application.Services.Interfaces;
using System.Threading;

const int maxRestartAttempts = 5;
int restartAttempts = 0;

while (restartAttempts < maxRestartAttempts)
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
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:3000","http://192.168.15.5:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // Configure JWT Authentication
    var jwtKey = builder.Configuration["Jwt:Key"];
    if (string.IsNullOrEmpty(jwtKey))
    {
        throw new InvalidOperationException("JWT:Key configuration is required. Set it in environment variables or appsettings.json.");
    }
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ImovPlanAPI";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ImovPlanClient";

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

    // Configure MongoDB
    var mongoSettings = new MongoDbSettings();
    builder.Configuration.GetSection("MongoDbSettings").Bind(mongoSettings);
    var mongoClient = new MongoClient(mongoSettings.ConnectionString);
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseMongoDB(mongoClient, mongoSettings.DatabaseName));

    // Register Repositories
    builder.Services.AddScoped<IParticipanteRepository, ParticipanteRepository>();
    builder.Services.AddScoped<IPlanejamentoRepository, PlanejamentoRepository>();
    builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
    builder.Services.AddScoped<IHistoricoAporteRepository, HistoricoAporteRepository>();
    builder.Services.AddScoped<IAporteExtraRepository, AporteExtraRepository>();
    builder.Services.AddScoped<IGastoDetalhadoRepository, GastoDetalhadoRepository>();
    builder.Services.AddScoped<IHistoricoSimulacaoRepository, HistoricoSimulacaoRepository>();

    // Register Services
    builder.Services.AddScoped<ICalculoFinanceiroService, CalculoFinanceiroService>();
    builder.Services.AddScoped<ISimulacaoService, SimulacaoService>();
    builder.Services.AddScoped<IFinanciamentoService, FinanciamentoService>();
    builder.Services.AddScoped<IPlanoService, PlanejamentoService>();
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
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    try
    {
        app.Run();
        break; // Normal exit
    }
    catch (Exception ex)
    {
        restartAttempts++;
        Console.WriteLine($"Unhandled exception: {ex.Message}\nRestarting API (attempt {restartAttempts}/{maxRestartAttempts})...");
        
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        var delay = (int)Math.Pow(2, restartAttempts) * 1000;
        Thread.Sleep(delay);
        
        if (restartAttempts >= maxRestartAttempts)
        {
            Console.WriteLine($"Max restart attempts ({maxRestartAttempts}) reached. Giving up.");
            throw; // Re-throw to let the process fail
        }
    }
}
