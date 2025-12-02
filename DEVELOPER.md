# Setting up your development environment

1. Ping Felis, go ask him to create a development database for you.

2. In your backend, set up an `appsettings.Development.json` and populate it like this:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Debug"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=[GO ASK FELIS];Database=[GO ASK FELIS];Username=[GO ASK FELIS];Password=[GO ASK FELIS]"
  }
}
```

3. Happy coding, run `dotnet run` to serve both frontend & backend
