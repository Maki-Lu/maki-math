using Microsoft.AspNetCore.Mvc;
using MathAPI.Data;
using MathAPI.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;

namespace MathAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MathContext _context;
        private const string Secret = "ThisIsASecretKeyForMakiMathPlatform2025!DoNotShare";

        public AuthController(MathContext context)
        {
            _context = context;
        }

        // 超级管理员初始化接口（只能在数据库为空时调用一次）
        [HttpPost("init-admin")]
        public IActionResult InitAdmin()
        {
            if (_context.Users.Any()) return BadRequest("Users already exist.");
            
            var admin = new User 
            { 
                Username = "admin", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), // 默认密码
                Role = UserRole.Admin 
            };
            _context.Users.Add(admin);
            _context.SaveChanges();
            return Ok("Admin created.");
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            var user = _context.Users.SingleOrDefault(u => u.Username == dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized("Invalid credentials");

            // 生成 JWT Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(Secret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] 
                { 
                    new Claim(ClaimTypes.Name, user.Id.ToString()),
                    new Claim(ClaimTypes.Role, user.Role.ToString())
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return Ok(new { Token = tokenHandler.WriteToken(token), Role = user.Role.ToString() });
        }
    }

    public class LoginDto
    {
	    public string Username { get; set; } = string.Empty;
	    public string Password { get; set; } = string.Empty;
    }
}
