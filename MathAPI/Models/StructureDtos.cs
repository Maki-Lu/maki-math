namespace MathAPI.Models
{
    public class NodeSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
    }

    public class BubbleStructureDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public BubbleLayout ChildLayout { get; set; }
        
        public List<NodeSummaryDto> Nodes { get; set; } = new List<NodeSummaryDto>();
        
        // 删掉下面这行，或者把它注释掉，因为后端不再填充它了
        // public List<BubbleStructureDto> Children { get; set; } = ...
    }
}
