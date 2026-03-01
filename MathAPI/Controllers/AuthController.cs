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

        // 在构造函数中统一注入数据库、邮件和缓存服务
        public AuthController(MathContext context, IFluentEmail fluentEmail, IMemoryCache cache)
        {
            _context = context;
            _fluentEmail = fluentEmail;
            _cache = cache;
        }

        // ================= 1. 现有接口 =================

        // 超级管理员初始化接口（只能在数据库为空时调用一次）
        [HttpPost("init-admin")]
        public IActionResult InitAdmin()
        {
            if (_context.Users.Any()) return BadRequest(new { message = "Users already exist." });
            
            var admin = new User 
            { 
                Username = "admin", 
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), // 默认密码
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

            return Ok(new { token = tokenHandler.WriteToken(token), role = user.Role.ToString() });
        }

        // ================= 2. 新增：注册及验证码接口 =================

        [HttpPost("send-code")]
        public async Task<IActionResult> SendCode([FromBody] SendCodeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "邮箱不能为空" });

            // 1. 生成 6 位随机验证码
            string code = new Random().Next(100000, 999999).ToString();

            // 2. 存入内存缓存，Key 为邮箱，有效期 5 分钟
            _cache.Set(dto.Email, code, TimeSpan.FromMinutes(5));

            // 3. 发送邮件
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
            // 1. 校验验证码是否存在且匹配
            if (!_cache.TryGetValue(dto.Email, out string? savedCode) || savedCode != dto.Code)
            {
                return BadRequest(new { message = "验证码错误或已过期，请重新获取" });
            }

            // 2. 检查用户名是否已存在
            if (_context.Users.Any(u => u.Username == dto.Username))
            {
                return BadRequest(new { message = "该用户名已被注册" });
            }

            // 3. 创建新用户
            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email, // ⚠️ 注意：如果你的 User.cs 模型里加了 Email 字段，请把这行开头的注释删掉！
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = UserRole.User // 赋予普通用户权限 (枚举值为 0)
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            // 4. 注册成功后清除缓存，防止验证码被重复使用
            _cache.Remove(dto.Email);

            return Ok(new { message = "注册成功！" });
        }


        // ================= 3. 新增：找回密码接口 =================

        [HttpPost("forgot-password/send-code")]
        public async Task<IActionResult> SendResetCode([FromBody] SendCodeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "邮箱不能为空" });

            // 1. 检查该邮箱是否在数据库中存在
            var user = _context.Users.SingleOrDefault(u => u.Email == dto.Email);
            if (user == null)
            {
                // 为了安全，有时候这里会故意返回成功以防别人恶意猜测注册邮箱。
                // 但对于个人项目，直接提示“邮箱未注册”用户体验更好。
                return BadRequest(new { message = "该邮箱尚未注册账号" });
            }

            // 2. 生成 6 位随机验证码
            string code = new Random().Next(100000, 999999).ToString();

            // 3. 存入内存缓存（注意：Key 前面加了 "Reset_" 前缀，防止跟注册验证码冲突）
            _cache.Set($"Reset_{dto.Email}", code, TimeSpan.FromMinutes(5));

            // 4. 发送邮件（在邮件里顺便告诉用户他的 Username）
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
            // 1. 校验验证码是否存在且匹配 (注意要加上 "Reset_" 前缀)
            if (!_cache.TryGetValue($"Reset_{dto.Email}", out string? savedCode) || savedCode != dto.Code)
            {
                return BadRequest(new { message = "验证码错误或已过期，请重新获取" });
            }

            // 2. 找到对应用户
            var user = _context.Users.SingleOrDefault(u => u.Email == dto.Email);
            if (user == null)
            {
                return BadRequest(new { message = "找不到该邮箱对应的用户" });
            }

            // 3. 更新密码 (使用 BCrypt 重新加密新密码)
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.SaveChanges();

            // 4. 重置成功后清除缓存的验证码
            _cache.Remove($"Reset_{dto.Email}");

            return Ok(new { message = "密码重置成功！", username = user.Username });
        }
    }




    // ================= 3. 数据传输对象 (DTOs) =================

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
}


// 新增：重置密码的 DTO
    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }