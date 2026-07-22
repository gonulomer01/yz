using Microsoft.EntityFrameworkCore;
using yz.Models;
namespace yz.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        public DbSet<ApiKey> ApiKeys { get; set; }
        public DbSet<AppSetting> AppSettings { get; set; }
        public DbSet<GeneratedImage> GeneratedImages { get; set; }
        public DbSet<User> Users { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<ApiKey>(entity =>
            {
                entity.Property(k => k.Id).ValueGeneratedNever();
            });
            modelBuilder.Entity<AppSetting>().HasData(
                new AppSetting { Key = "CurrentKeyIndex", Value = "0" },
                new AppSetting { Key = "LastResetDate", Value = "" }
            );
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
            });
        }
    }
}