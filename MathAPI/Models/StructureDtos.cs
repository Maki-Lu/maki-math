namespace MathAPI.Models
{
    // 瘦身版知识点
    public class NodeSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        // public int OrderIndex { get; set; } // 暂时不用排序，先注释掉防报错
    }

    // 瘦身版泡泡结构
    public class BubbleStructureDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public BubbleLayout ChildLayout { get; set; }
        // public int OrderIndex { get; set; } // 暂时不用排序

        // 知识点列表 (瘦身版)
        public List<NodeSummaryDto> Nodes { get; set; } = new List<NodeSummaryDto>();

        // === 修复关键：找回丢失的子泡泡列表！===
        public List<BubbleStructureDto> Children { get; set; } = new List<BubbleStructureDto>();
    }
}
