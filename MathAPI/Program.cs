using Microsoft.EntityFrameworkCore;
using MathAPI.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;
using System.Security.Cryptography;
using MathAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. 配置数据库
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<MathContext>(options =>
    options.UseNpgsql(connectionString));

// 2. 配置 JWT 鉴权
var jwtKey = builder.Configuration["Jwt:Secret"] ?? builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT secret is not configured. Set Jwt:Secret or JWT_SECRET.");
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// 3. 核心修改：配置 JSON 序列化，忽略循环引用
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // 遇到循环引用时，自动忽略，防止崩溃
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var initAdminToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
builder.Services.AddSingleton(new InitAdminOptions(initAdminToken));

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
startupLogger.LogWarning("Init admin bootstrap token (header: X-Init-Token): {InitAdminToken}", initAdminToken);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // also serve frontend at the same address in development
    var frontendDist = Path.Combine(builder.Environment.ContentRootPath, "../web-client/dist");
    app.Use(async (ctx, next) =>
    {
        // If the path has no extension (e.g. /, /dashboard, /login)
        // rewrite it to /index.html so static file middleware can serve it.
        if (!Path.HasExtension(ctx.Request.Path.Value))
        {
            ctx.Request.Path = "/index.html";
        }

        await next();
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(frontendDist),
        RequestPath = ""
    });
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
