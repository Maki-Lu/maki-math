namespace MathAPI.Models
{
    public enum UserRole
    {
        User = 0,       // 普通用户
        Editor = 1,     // 编写者
        Reviewer = 2,   // 审核者
        Admin = 3       // 超级管理员
    }

    public enum ContentStatus
    {
        Pending = 0,    // 待审核
        Active = 1,     // 已发布
        Deleted = 2     // 已删除（逻辑删除）
    }

    public enum BubbleLayout
    {
        Ordered = 0,    // 内部完全有序（纵向）
        Unordered = 1   // 内部完全无序（随机/横向）
    }
}
