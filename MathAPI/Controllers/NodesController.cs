using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using MathAPI.Data;
using MathAPI.Models;
using System.Security.Claims;

namespace MathAPI.Controllers
{
    [Route("api/[controller]")] // 访问路径是 /api/nodes
    [ApiController]
    public class NodesController : ControllerBase
    {
        private readonly MathContext _context;

        public NodesController(MathContext context)
        {
            _context = context;
        }

        // GET: api/nodes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<KnowledgeNode>>> GetNodes()
        {
            // 从数据库查数据，转成 JSON 返回
            return await _context.Nodes.ToListAsync();
        }

        // POST: api/nodes (用于临时添加数据)
        [HttpPost]
        [Authorize(Roles = "Editor,Reviewer,Admin")]
        public async Task<ActionResult<KnowledgeNode>> PostNode([FromBody] CreateNodeDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int parsedUserId))
            {
                return Unauthorized("Invalid user identity");
            }
            
            var maxOrderIndex = await _context.Nodes
                .Where(n => n.ParentBubbleId == dto.ParentBubbleId)
                .MaxAsync(n => (int?)n.OrderIndex) ?? -1;

            var node = new KnowledgeNode
            {
                Title = dto.Title,
                Content = dto.Content,
                ParentBubbleId = dto.ParentBubbleId,
                OrderIndex = maxOrderIndex + 1,
                Status = ContentStatus.Active,
                CreatedByUserId = parsedUserId
            };
            _context.Nodes.Add(node);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetNodes), new { id = node.Id }, node);
        }
    }

}
