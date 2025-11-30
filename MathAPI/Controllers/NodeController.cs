using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MathAPI.Data;
using MathAPI.Models;
using Microsoft.AspNetCore.Authorization;

namespace MathAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NodeController : ControllerBase
    {
        private readonly MathContext _context;

        public NodeController(MathContext context)
        {
            _context = context;
        }

        // 添加知识点 (需 Editor 权限)
        [HttpPost]
        [Authorize(Roles = "Editor,Reviewer,Admin")]
        public async Task<IActionResult> CreateNode([FromBody] CreateNodeDto dto)
        {
            var bubble = await _context.Bubbles.FindAsync(dto.ParentBubbleId);
            if (bubble == null) return NotFound("Parent bubble not found");

            var node = new KnowledgeNode
            {
                Title = dto.Title,
                Content = dto.Content,
                ParentBubbleId = dto.ParentBubbleId,
                Status = ContentStatus.Active // 简化流程，默认直接发布
            };

            _context.Nodes.Add(node);
            await _context.SaveChangesAsync();
            return Ok(node);
        }

	// 修改知识点
        [HttpPut("{id}")]
        [Authorize(Roles = "Editor,Reviewer,Admin")]
        public async Task<IActionResult> UpdateNode(int id, [FromBody] CreateNodeDto dto)
        {
            var node = await _context.Nodes.FindAsync(id);
            if (node == null) return NotFound();

            node.Title = dto.Title;
            node.Content = dto.Content;
            
            await _context.SaveChangesAsync();
            return Ok(node);
        }

        // 删除知识点 (需 Admin 权限)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteNode(int id)
        {
            var node = await _context.Nodes.FindAsync(id);
            if (node == null) return NotFound();

            _context.Nodes.Remove(node);
            await _context.SaveChangesAsync();
            return Ok("Deleted");
        }
    }

    public class CreateNodeDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int ParentBubbleId { get; set; }
    }
}
