using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("/api/[controller]")]
public class HelloController : ControllerBase
{
    [HttpGet("hello")]
    public string Hello()
    {
        return "Hello, makiki!";
    }

    [HttpGet("echo")]
    public string Echo([FromQuery] string str)
    {
        return $"You've entered: {str} in the query"; 
    }
}