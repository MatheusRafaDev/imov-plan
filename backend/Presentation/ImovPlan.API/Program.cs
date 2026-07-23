// Program.cs — Responsabilidade de restart delegada ao orquestrador (Docker, systemd, etc.)
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using MongoDB.Driver;
using ImovPlan.Infrastructure.Data;
using ImovPlan.Infrastructure.Configurations;
using ImovPlan.Infrastructure.Repositories;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.API.Services;
using FluentValidation;
using ImovPlan.API.Filters;

var builder = WebApplication.CreateBuilder(args);

// Aviso de logging padrao
builder.Logging.AddConsole();

// Load .env file from the backend root (try multiple paths)
try
{
    // When running from API project dir: ../../.env = backend/.env
    // When running from solution dir: backend/.env
    var envPaths = new[]
    {
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".env"),
        "../../.env",
        "../.env",
        "backend/.env",
        ".env"
    };
    foreach (var path in envPaths)
    {
        if (File.Exists(path))
        {
            DotNetEnv.Env.Load(path);
            break;
        }
    }
}
catch { /* .env not found, continue with appsettings */ }
builder.Configuration.AddEnvironmentVariables();

// Add services to the container.
builder.Services.AddMemoryCache();
builder.Services.AddControllers(options => 
{
    options.Filters.Add<ValidationFilterAttribute>();
});

builder.Services.AddValidatorsFromAssemblyContaining<ImovPlan.Application.Validators.AporteExtraDtoValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<ImovPlan.API.Validators.RegisterRequestValidator>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS — origins from configuration (appsettings.json / env)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("ia", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("geocode", opt =>
    {
        opt.PermitLimit = 1;
        opt.Window = TimeSpan.FromSeconds(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429;
});

builder.Services.AddHttpClient("Nominatim", client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "CasalPlanner/1.0 (Contact: matheusrafadev@github)");
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("JWT:Key configuration is required. Set it in environment variables or appsettings.json.");
}
var jwtKeyBytes = Encoding.UTF8.GetBytes(jwtKey);
if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException("JWT:Key must be at least 32 bytes long when using HS256. Update the key in environment variables or appsettings.");
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
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("token"))
            {
                context.Token = context.Request.Cookies["token"];
            }
            return Task.CompletedTask;
        }
    };
});

// Configure MongoDB
var mongoSettings = new MongoDbSettings();
builder.Configuration.GetSection("MongoDbSettings").Bind(mongoSettings);
var mongoClient = new MongoClient(mongoSettings.ConnectionString);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMongoDB(mongoClient, mongoSettings.DatabaseName));

// Configurar índice TTL para cache de pontos de interesse (15 dias)
var mongoDatabase = mongoClient.GetDatabase(mongoSettings.DatabaseName);
var cacheCollection = mongoDatabase.GetCollection<MongoDB.Bson.BsonDocument>("pontosInteresseCache");
var indexKeysDefinition = Builders<MongoDB.Bson.BsonDocument>.IndexKeys.Ascending("createdAt");
var indexOptions = new CreateIndexOptions { ExpireAfter = TimeSpan.FromDays(15) };
var indexModel = new CreateIndexModel<MongoDB.Bson.BsonDocument>(indexKeysDefinition, indexOptions);
cacheCollection.Indexes.CreateOne(indexModel);

builder.Services.AddHealthChecks()
    .AddAsyncCheck("mongodb", async () =>
    {
        try
        {
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            await mongoClient.ListDatabaseNamesAsync(timeoutCts.Token);
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("MongoDB falhou", ex);
        }
    });

// Register Repositories
builder.Services.AddScoped<IParticipanteRepository, ParticipanteRepository>();
builder.Services.AddScoped<IPlanejamentoRepository, PlanejamentoRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IHistoricoAporteRepository, HistoricoAporteRepository>();
builder.Services.AddScoped<IAporteExtraRepository, AporteExtraRepository>();
builder.Services.AddScoped<IGastoDetalhadoRepository, GastoDetalhadoRepository>();
builder.Services.AddScoped<IHistoricoSimulacaoRepository, HistoricoSimulacaoRepository>();
builder.Services.AddScoped<IParametrosFinanceirosRepository, ParametrosFinanceirosRepository>();

// Register Services
builder.Services.AddScoped<ICalculoFinanceiroService, CalculoFinanceiroService>();
builder.Services.AddScoped<ISimulacaoService, SimulacaoService>();
builder.Services.AddScoped<IFinanciamentoService, FinanciamentoService>();
builder.Services.AddScoped<IPlanoService, PlanejamentoService>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IEmailService, ImovPlan.Infrastructure.Services.ResendEmailService>();
builder.Services.AddHttpClient<IAiConsultingService, ImovPlan.Infrastructure.Services.GroqAiService>();
builder.Services.AddHttpClient<ImovPlan.Application.Services.Interfaces.IPontoInteresseProvider, ImovPlan.Infrastructure.Services.OverpassPontoInteresseService>();
builder.Services.AddScoped<IPontoInteresseService, ImovPlan.Infrastructure.Services.AggregatedPontoInteresseService>();
builder.Services.AddHttpClient<IFinancialRatesProvider, ImovPlan.Infrastructure.Services.BrasilApiFinancialProvider>();
builder.Services.AddHttpClient<ILocationProvider, ImovPlan.Infrastructure.Services.BrasilApiLocationProvider>();

// Background Services
builder.Services.AddHostedService<ImovPlan.API.Services.LembretePlanejamentoService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseHttpsRedirection();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
    if (!context.Request.Host.Host.Contains("localhost"))
    {
        context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }
    await next();
});
app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
