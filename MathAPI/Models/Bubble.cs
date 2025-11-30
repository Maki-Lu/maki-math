using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MathAPI.Models
{
    public class Bubble
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty; // 泡泡名称（或课程名称）

        // 父泡泡ID，如果是顶级泡泡（课程），则为 null
        public int? ParentId { get; set; }
        [ForeignKey("ParentId")]
        public Bubble? Parent { get; set; }

        // === 核心约束属性 ===
        // 定义这个泡泡内部的子元素是“有序”还是“无序”
        public BubbleLayout ChildLayout { get; set; } = BubbleLayout.Ordered;

        // 如果在有序的父泡泡中，这个字段决定顺序
        public int OrderIndex { get; set; } = 0;

        // 审核状态
        public ContentStatus Status { get; set; } = ContentStatus.Pending;

        // 包含的子泡泡
        public List<Bubble> Children { get; set; } = new List<Bubble>();
        
        // 包含的知识点
        public List<KnowledgeNode> Nodes { get; set; } = new List<KnowledgeNode>();
    }
}
