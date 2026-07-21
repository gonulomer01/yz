using System;

namespace yz.Models
{
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
}

