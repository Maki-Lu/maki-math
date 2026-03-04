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

3. Run backend and frontend separately:

```bash
# terminal 1 (backend)
cd MathAPI
dotnet run

# terminal 2 (frontend)
cd web-client
cp .env.development.example .env.development.local
npm install
npm run dev
```

4. If backend is not running at `http://localhost:5204`, update `web-client/.env.development.local`:

```env
VITE_BACKEND_URL=http://localhost:5000
```
