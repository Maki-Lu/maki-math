using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MathAPI.Data;
using MathAPI.Models;

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
        public async Task<ActionResult<KnowledgeNode>> PostNode(KnowledgeNode node)
        {
            _context.Nodes.Add(node);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetNodes), new { id = node.Id }, node);
        }
    }
}
