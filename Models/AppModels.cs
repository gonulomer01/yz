using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace yz.Models
{
    public class ApiKey
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Label { get; set; } = string.Empty;

        public string KeyValue { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        public int UsageToday { get; set; } = 0;

        public int TotalUsage { get; set; } = 0;
    }

    public class AppSetting
    {
        [Key]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Value { get; set; } = string.Empty;
    }

    public class GeneratedImage
    {
        public int Id { get; set; }
        public string Prompt { get; set; } = "";
        public string ImagePath { get; set; } = "";
        public string ModelUsed { get; set; } = "";
        public string KeyUsedLabel { get; set; } = "";
        public int ApiKeyId { get; set; }
        public int UserId { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string? GroupId { get; set; }
        public bool IsSelected { get; set; } = true;
        public string SourceSite { get; set; } = "gemini";
    }

    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string DisplayName { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = "Kullanıcı";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
