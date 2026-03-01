## 登录注册功能须知。


如果想要测试登录注册功能。

请前往 MathAPI/Program.cs 里**修改这一行**： User = "makimathadmin@163.com", // 你可以用自己的163邮箱来测试。

------------------------------------------------
// 4. 配置 FluentEmail

// 直接从配置文件里拿密码

var emailPassword = builder.Configuration["EmailPassword"];

builder.Services
    .AddFluentEmail("makimathadmin@163.com", "Maki-Math")
    .AddMailKitSender(new FluentEmail.MailKitSmtp.SmtpClientOptions
    {
        Server = "smtp.163.com",
        Port = 465,
        UseSsl = true, 
        User = "makimathadmin@163.com", // 你可以用自己的163邮箱来测试。
        Password = emailPassword, //存在文件 ：appsettings.Development.json
        RequiresAuthentication = true 
    });

----------------------------------------------



为了安全考虑，同时仍需要在本地 MathAPI/ 目录里自己创建一个文件存放邮箱的 SMTP 授权码 

文件名：appsettings.Development.json


文件内容：{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "EmailPassword": "密码" //( 这里换成你自己的邮箱 SMTP 授权码)
}