namespace MathAPI.DTOs
{
    // 用于接收前端“获取验证码”的请求
    public class SendCodeRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    // 用于接收前端“提交注册”的请求
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}