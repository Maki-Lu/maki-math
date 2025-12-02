using Microsoft.EntityFrameworkCore;
using MathAPI.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// 1. 配置数据库
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<MathContext>(options =>
    options.UseNpgsql(connectionString));

// 2. 配置 JWT 鉴权
var jwtKey = "ThisIsASecretKeyForMakiMathPlatform2025!DoNotShare";
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

var app = builder.Build();

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
