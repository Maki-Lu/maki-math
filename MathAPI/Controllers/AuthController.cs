using Microsoft.AspNetCore.Mvc;
using MathAPI.Data;
using MathAPI.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using FluentEmail.Core;
using Microsoft.Extensions.Caching.Memory;

namespace MathAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly MathContext _context;
        private readonly IFluentEmail _fluentEmail;
        private readonly IMemoryCache _cache;
        
        private const string Secret = "ThisIsASecretKeyForMakiMathPlatform2025!DoNotShare";

        public AuthController(MathContext context, IFluentEmail fluentEmail, IMemoryCache cache)
        {
            _context = context;
            _fluentEmail = fluentEmail;
            _cache = cache;
        }

        
        // 超级管理员初始化接口（只能在数据库为空时调用一次）

        [HttpPost("init-admin")]
        public IActionResult InitAdmin()
        {
            if (_context.Users.Any()) return BadRequest(new { message = "Users already exist." });
            
            var admin = new User 
            { 
                Username = "admin", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Role = UserRole.Admin 
            };
            _context.Users.Add(admin);
            _context.SaveChanges();
            return Ok(new { message = "Admin created." });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            var user = _context.Users.SingleOrDefault(u => u.Username == dto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Invalid credentials" });

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

            return Ok(new { token = tokenHandler.WriteToken(token), role = user.Role.ToString() });
        }

        // ================= 2. 注册及验证码接口 =================

        [HttpPost("send-code")]
        public async Task<IActionResult> SendCode([FromBody] SendCodeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "邮箱不能为空" });

            // 检查邮箱是否已经被注册过了
            if (_context.Users.Any(u => u.Email == dto.Email))
            {
                return BadRequest(new { message = "该邮箱已被注册，请直接登录或找回密码" });
            }

            string lockKey = $"Lock_Reg_{dto.Email}";
            if (_cache.TryGetValue(lockKey, out _))
            {
                return BadRequest(new { message = "操作过于频繁，请 60 秒后再试" });
            }

            string code = new Random().Next(100000, 999999).ToString();

            _cache.Set(dto.Email, code, TimeSpan.FromMinutes(5));
            _cache.Set(lockKey, true, TimeSpan.FromSeconds(60));

            var response = await _fluentEmail
                .To(dto.Email)
                .Subject("MakiMath 注册验证码")
                .Body($"欢迎注册 MakiMath！\n\n您的验证码是：{code}\n请在 5 分钟内完成注册。如果非本人操作，请忽略此邮件。")
                .SendAsync();

            if (response.Successful)
                return Ok(new { message = "验证码已发送，请查收" });

            return StatusCode(500, new { message = "邮件发送失败，请稍后再试", errors = response.ErrorMessages });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            if (!_cache.TryGetValue(dto.Email, out string? savedCode) || savedCode != dto.Code)
            {
                return BadRequest(new { message = "验证码错误或已过期，请重新获取" });
            }

            // 注册前做保底查重（防并发）
            if (_context.Users.Any(u => u.Email == dto.Email))
            {
                return BadRequest(new { message = "该邮箱已被注册" });
            }

            if (_context.Users.Any(u => u.Username == dto.Username))
            {
                return BadRequest(new { message = "该用户名已被注册" });
            }

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRole.User 
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            _cache.Remove(dto.Email);

            return Ok(new { message = "注册成功！" });
        }


        // ================= 3. 找回密码接口 =================

        [HttpPost("forgot-password/send-code")]
        public async Task<IActionResult> SendResetCode([FromBody] SendCodeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "邮箱不能为空" });

            string lockKey = $"Lock_Reset_{dto.Email}";
            if (_cache.TryGetValue(lockKey, out _))
            {
                return BadRequest(new { message = "操作过于频繁，请 60 秒后再试" });
            }

            var user = _context.Users.SingleOrDefault(u => u.Email == dto.Email);
            if (user == null)
            {
                return BadRequest(new { message = "该邮箱尚未注册账号" });
            }

            string code = new Random().Next(100000, 999999).ToString();

            _cache.Set($"Reset_{dto.Email}", code, TimeSpan.FromMinutes(5));
            _cache.Set(lockKey, true, TimeSpan.FromSeconds(60));

            var response = await _fluentEmail
                .To(dto.Email)
                .Subject("MakiMath 账号找回与密码重置")
                .Body($"您正在尝试找回 MakiMath 账号。\n\n您的用户名是：{user.Username}\n您的重置验证码是：{code}\n\n请在 5 分钟内完成密码重置。如果非本人操作，请忽略此邮件。")
                .SendAsync();

            if (response.Successful)
                return Ok(new { message = "验证码及账号信息已发送到您的邮箱" });

            return StatusCode(500, new { message = "邮件发送失败，请稍后再试" });
        }

        [HttpPost("forgot-password/reset")]
        public IActionResult ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!_cache.TryGetValue($"Reset_{dto.Email}", out string? savedCode) || savedCode != dto.Code)
            {
                return BadRequest(new { message = "验证码错误或已过期，请重新获取" });
            }

            var user = _context.Users.SingleOrDefault(u => u.Email == dto.Email);
            if (user == null)
            {
                return BadRequest(new { message = "找不到该邮箱对应的用户" });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.SaveChanges();

            _cache.Remove($"Reset_{dto.Email}");

            return Ok(new { message = "密码重置成功！", username = user.Username });
        }
    }

    // ================= 4. 数据传输对象 (DTOs) =================

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class SendCodeDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}