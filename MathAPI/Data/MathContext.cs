using Microsoft.EntityFrameworkCore;
using MathAPI.Models;

namespace MathAPI.Data
{
    public class MathContext : DbContext
    {
        public MathContext(DbContextOptions<MathContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Bubble> Bubbles { get; set; }
        public DbSet<KnowledgeNode> Nodes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 确保用户名唯一
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        }
    }
}
