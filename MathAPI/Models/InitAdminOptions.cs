namespace MathAPI.Models;

public sealed class InitAdminOptions
{
    public string Token { get; }

    public InitAdminOptions(string token)
    {
        Token = token;
    }
}