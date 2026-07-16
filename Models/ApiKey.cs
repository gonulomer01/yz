using System.ComponentModel.DataAnnotations;

namespace yz.Models
{
    public class ApiKey
    {
        [Key]
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
}
