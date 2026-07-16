using System;
using System.ComponentModel.DataAnnotations;

namespace yz.Models
{
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
        public string Role { get; set; } = "Kullanıcı"; // "Yönetici" veya "Kullanıcı"

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
