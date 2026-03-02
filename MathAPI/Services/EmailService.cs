using FluentEmail.Core;
using MathAPI.Data;
using Microsoft.Extensions.Caching.Memory;

namespace MathAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly IFluentEmail _fluentEmail;
        private readonly IMemoryCache _cache;
        private readonly MathContext _context;

        public EmailService(IFluentEmail fluentEmail, IMemoryCache cache, MathContext context)
        {
            _fluentEmail = fluentEmail;
            _cache = cache;
            _context = context;
        }

        public async Task<(bool IsSuccess, string ErrorMessage)> SendRegistrationCodeAsync(string email)
        {
            // 1. 防刷机制：检查 60 秒内是否已经发送过
            string lockKey = $"Lock_Reg_{email}";
            if (_cache.TryGetValue(lockKey, out _))
            {
                return (false, "操作过于频繁，请 60 秒后再试");
            }

            // 2. 生成验证码
            string code = new Random().Next(100000, 999999).ToString();

            // 3. 发送邮件
            var response = await _fluentEmail
                .To(email)
                .Subject("MakiMath 注册验证码")
                .Body($"欢迎注册 MakiMath！\n\n您的验证码是：{code}\n请在 5 分钟内完成注册。如果非本人操作，请忽略此邮件。")
                .SendAsync();

            // 4. 如果发送成功，写入缓存并加锁
            if (response.Successful)
            {
                _cache.Set($"Reg_{email}", code, TimeSpan.FromMinutes(5)); // 验证码 5 分钟有效
                _cache.Set(lockKey, true, TimeSpan.FromSeconds(60));       // 锁定 60 秒不允许重发
                return (true, string.Empty);
            }

            return (false, "邮件发送失败，请稍后再试");
        }

        public async Task<(bool IsSuccess, string ErrorMessage)> SendPasswordResetCodeAsync(string email)
        {
            // 1. 防刷机制
            string lockKey = $"Lock_Reset_{email}";
            if (_cache.TryGetValue(lockKey, out _))
            {
                return (false, "操作过于频繁，请 60 秒后再试");
            }

            // 2. 检查该邮箱是否注册，并获取用户名
            var user = _context.Users.SingleOrDefault(u => u.Email == email);
            if (user == null)
            {
                return (false, "该邮箱尚未注册账号");
            }

            // 3. 生成验证码
            string code = new Random().Next(100000, 999999).ToString();

            // 4. 发送邮件
            var response = await _fluentEmail
                .To(email)
                .Subject("MakiMath 账号找回与密码重置")
                .Body($"您正在尝试找回 MakiMath 账号。\n\n您的用户名是：{user.Username}\n您的重置验证码是：{code}\n\n请在 5 分钟内完成密码重置。如果非本人操作，请忽略此邮件。")
                .SendAsync();

            // 5. 如果发送成功，写入缓存并加锁
            if (response.Successful)
            {
                _cache.Set($"Reset_{email}", code, TimeSpan.FromMinutes(5));
                _cache.Set(lockKey, true, TimeSpan.FromSeconds(60));
                return (true, string.Empty);
            }

            return (false, "邮件发送失败，请稍后再试");
        }
    }
}