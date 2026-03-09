using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace MathAPI.Data;

/// <summary>
/// Design-time DbContext factory for EF Core tools.
/// This avoids requiring the full web host (and JWT config) when running commands like:
/// dotnet ef migrations list/script
/// </summary>
public sealed class MathContextFactory : IDesignTimeDbContextFactory<MathContext>
{
    public MathContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("MathAPI/appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["ConnectionStrings:DefaultConnection"]
            // fallback so EF tooling that does not need a live DB (e.g. migrations list/script)
            // can still construct the context when no connection string is configured locally.
            ?? "Host=localhost;Database=mathapi_design;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<MathContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new MathContext(optionsBuilder.Options);
    }
}
