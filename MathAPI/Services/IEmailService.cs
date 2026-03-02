namespace MathAPI.Services
{
    public interface IEmailService
    {
        // 发送注册验证码（包含防刷和缓存逻辑）
        Task<(bool IsSuccess, string ErrorMessage)> SendRegistrationCodeAsync(string email);
        
        // 发送找回密码验证码（包含防刷、查库和缓存逻辑）
        Task<(bool IsSuccess, string ErrorMessage)> SendPasswordResetCodeAsync(string email);
    }
}