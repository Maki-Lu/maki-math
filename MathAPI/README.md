## 登录注册功能须知。


如果想要测试登录注册功能。

请前往 MathAPI/appsettings.json 里**修改这一行**： 

"SenderEmail": "", //填入自己的 163 邮箱

"Password": "" // 填入自己的 SMTP 授权码


-----------------------

{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "SmtpSettings": {
    "Server": "smtp.163.com",
    "Port": 465,
    "SenderEmail": "", //填入自己的 163 邮箱
    "SenderName": "Maki-Math",
    "Password": "" // 填入自己的 SMTP 授权码
  }
}


-------------------------------