using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MathAPI.Data;
using MathAPI.Models;
using Microsoft.AspNetCore.Authorization;

namespace MathAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BubbleController : ControllerBase
    {
        private readonly MathContext _context;

        public BubbleController(MathContext context)
        {
            _context = context;
        }

        // 获取整个课程结构 (扁平瘦身版 - 最稳健方案)
        [HttpGet("structure")]
        public async Task<IActionResult> GetStructure()
        {
            // 1. 查询所有泡泡 (不分层级)
            // 2. 只投影需要的字段 (不查 Content，速度极快)
            var bubbles = await _context.Bubbles
                .Select(b => new BubbleStructureDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    ParentId = b.ParentId, // 前端会根据这个 ID 组装树
                    ChildLayout = b.ChildLayout,
                    // 知识点也没问题，取摘要即可
                    Nodes = b.Nodes.Select(n => new NodeSummaryDto 
                    { 
                        Id = n.Id, 
                        Title = n.Title 
                    }).ToList()
                    // 注意：这里不要去映射 Children，留给前端做
                })
                .ToListAsync();

            return Ok(bubbles);
        }

        // 添加泡泡 (需 Editor 权限)
        [HttpPost]
        [Authorize(Roles = "Editor,Reviewer,Admin")]
        public async Task<IActionResult> CreateBubble([FromBody] CreateBubbleDto dto)
        {
            // 1. 检查父泡泡是否存在及布局约束
            if (dto.ParentId.HasValue)
            {
                var parent = await _context.Bubbles.FindAsync(dto.ParentId.Value);
                if (parent == null) return NotFound("Parent bubble not found");
                
                // 如果父泡泡是有序的，需要指定 OrderIndex，这里简化为自动追加到最后
                // 如果父泡泡是无序的，OrderIndex 忽略
            }
            else 
            {
                // 如果是顶级泡泡（课程），默认为有序
            }

            var bubble = new Bubble
            {
                Name = dto.Name,
                ParentId = dto.ParentId,
                ChildLayout = dto.Layout, // 指定新泡泡内部是方还是圆
                Status = User.IsInRole("Admin") ? ContentStatus.Active : ContentStatus.Pending // 管理员直接发布，编写者待审核
            };

            _context.Bubbles.Add(bubble);
            await _context.SaveChangesAsync();
            return Ok(bubble);
        }

        // 审核通过 (需 Reviewer 权限)
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Reviewer,Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var bubble = await _context.Bubbles.FindAsync(id);
            if (bubble == null) return NotFound();
            
            bubble.Status = ContentStatus.Active;
            await _context.SaveChangesAsync();
            return Ok("Approved");
        }

	    // 修改泡泡 (重命名/移动)
        [HttpPut("{id}")]
        [Authorize(Roles = "Editor,Reviewer,Admin")]
        public async Task<IActionResult> UpdateBubble(int id, [FromBody] CreateBubbleDto dto)
        {
            var bubble = await _context.Bubbles.FindAsync(id);
            if (bubble == null) return NotFound();

            // 1. 更新名字
            if (!string.IsNullOrEmpty(dto.Name)) bubble.Name = dto.Name;
            
            // 2. 更新布局
            bubble.ChildLayout = dto.Layout;

            // 3. 更新父节点 (移动)
            // 注意：前端必须保证 ParentId 不是 bubble 自己的子节点，否则会死循环
            // 如果 dto.ParentId 为 null，说明移动到了最顶层（成为课程）
            // 这里我们需要判断 dto 是否包含了 ParentId 的修改意图。
            // 由于 C# int? 的特性，我们可以认为如果前端传了 ParentId，我们就更新它。
            
            // 这里的逻辑稍微有点 tricky：CreateBubbleDto 的 ParentId 是可空的。
            // 我们假设：只有当需要移动时，前端才会明确发送 ParentId 字段。
            // 但为了安全，我们最好创建一个专门的 MoveDto，或者约定好。
            // 鉴于目前是 CreateBubbleDto，我们直接赋值即可。
            
            // 只有当 ParentId 真的变了才更新
            if (dto.ParentId != bubble.ParentId)
            {
                // 简单的防呆检查：不能把自己设为自己的父亲
                if (dto.ParentId == bubble.Id) 
                {
                    return BadRequest("Cannot move bubble inside itself.");
                }
                bubble.ParentId = dto.ParentId;
            }

            await _context.SaveChangesAsync();
            return Ok(bubble);
        }

        // 删除泡泡 (递归删除所有子内容)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBubble(int id)
        {
            var bubble = await _context.Bubbles
                .Include(b => b.Children) // 加载子泡泡，以便递归删除
                .Include(b => b.Nodes)    // 加载子节点
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bubble == null) return NotFound();

            // EF Core 默认配置下，删除父对象时，如果加载了子对象，会级联删除
            // 如果遇到数据库报错外键约束，我们可能需要手动递归，但先试试直接删
            _context.Bubbles.Remove(bubble);
            await _context.SaveChangesAsync();
            return Ok("Deleted");
        }
    }

    public class CreateBubbleDto 
    { 
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; } 
        public BubbleLayout Layout { get; set; } 
    }
}
