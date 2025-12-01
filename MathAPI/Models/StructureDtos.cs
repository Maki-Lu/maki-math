namespace MathAPI.Models
{
    // 瘦身版知识点：只有标题和ID，没有 Content！
    public class NodeSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }

    // 瘦身版泡泡：只包含结构信息
    public class BubbleStructureDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public BubbleLayout ChildLayout { get; set; }
        public int OrderIndex { get; set; }
        
        // 这里的 Node 也是瘦身版的
        public List<NodeSummaryDto> Nodes { get; set; } = new List<NodeSummaryDto>();
    }
}
