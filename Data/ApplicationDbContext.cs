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
            for (int i = 1; i <= 10; i++)
            {
                modelBuilder.Entity<ApiKey>().HasData(
                    new ApiKey { Id = i, Label = $"Hesap {i}", KeyValue = "", Status = "Active", UsageToday = 0, TotalUsage = 0 }
                );
            }
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