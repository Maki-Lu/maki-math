using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MathAPI.Models
{
    public class KnowledgeNode
    {
        public int Id { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string Content { get; set; } = string.Empty; // Markdown/LaTeX

        // 必须属于一个泡泡
        public int ParentBubbleId { get; set; }
        [ForeignKey("ParentBubbleId")]
        public Bubble? ParentBubble { get; set; }

        // 如果在有序泡泡中，决定顺序
        public int OrderIndex { get; set; } = 0;

        // 审核状态
        public ContentStatus Status { get; set; } = ContentStatus.Pending;
        
        // 记录是谁创建的（可选，方便审核）
        public int CreatedByUserId { get; set; }
    }
}
