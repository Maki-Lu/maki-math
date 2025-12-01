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

        // 获取整个课程结构 (瘦身版)
        [HttpGet("structure")]
        public async Task<IActionResult> GetStructure()
        {
            // 使用 Select 进行投影 (Projection)，只取需要的字段
            // 这样数据库绝对不会读取 Content 列，速度极快
            var bubbles = await _context.Bubbles
                .Select(b => new BubbleStructureDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    ParentId = b.ParentId,
                    ChildLayout = b.ChildLayout,
                    OrderIndex = b.OrderIndex,
                    Nodes = b.Nodes.Select(n => new NodeSummaryDto 
                    { 
                        Id = n.Id, 
                        Title = n.Title,
                        OrderIndex = n.OrderIndex
                    }).ToList()
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

            // 更新名字
            if (!string.IsNullOrEmpty(dto.Name)) bubble.Name = dto.Name;
            
            // 更新布局
            bubble.ChildLayout = dto.Layout;

            // 如果涉及移动(ParentId改变)，逻辑比较复杂，暂时先只支持改名和布局
            // 稍后我们专门写一个 Move 接口
            
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
