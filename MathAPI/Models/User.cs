using System.ComponentModel.DataAnnotations;

namespace MathAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        [Required]
        public string Username { get; set; } = string.Empty;
        [Required]
        public string PasswordHash { get; set; } = string.Empty; // 存储加密后的密码

        [Required]
        public string Email { get; set; } = string.Empty;

        
        public UserRole Role { get; set; } = UserRole.User;
    }
}
