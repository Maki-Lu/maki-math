using Microsoft.AspNetCore.Mvc;
using MathAPI.Data;
using MathAPI.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace MathAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MathContext _context;
        private readonly InitAdminOptions _initAdminOptions;
        private readonly ILogger<AuthController> _logger;
        private readonly string _jwtSecret;

        public AuthController(
            MathContext context,
            InitAdminOptions initAdminOptions,
            ILogger<AuthController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _initAdminOptions = initAdminOptions;
            _logger = logger;
            _jwtSecret = configuration["Jwt:Secret"] ?? configuration["JWT_SECRET"]
                ?? throw new InvalidOperationException("JWT secret is not configured. Set Jwt:Secret or JWT_SECRET.");
        }

        // 超级管理员初始化接口（只能在数据库为空时调用一次）
        [HttpPost("init-admin")]
        public IActionResult InitAdmin([FromHeader(Name = "X-Init-Token")] string? initToken)
        {
            var expectedToken = _initAdminOptions.Token;
            if (string.IsNullOrWhiteSpace(expectedToken))
            {
                _logger.LogError("Init-admin endpoint invoked but no InitAdminToken is configured.");
                return StatusCode(500, "Init admin token is not configured.");
            }

            if (string.IsNullOrWhiteSpace(initToken) || initToken != expectedToken)
            {
                _logger.LogWarning("Rejected init-admin attempt from {RemoteIp} due to invalid token.", HttpContext.Connection.RemoteIpAddress);
                return Unauthorized("Invalid init token.");
            }

            if (_context.Users.Any()) return BadRequest("Users already exist.");

            var adminPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(18));
            
            var admin = new User 
            { 
                Username = "admin", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Role = UserRole.Admin 
            };
            _context.Users.Add(admin);
            _context.SaveChanges();

            _logger.LogWarning("Initial admin created. Username: admin, Password: {AdminPassword}", adminPassword);

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
            var key = Encoding.ASCII.GetBytes(_jwtSecret);
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
