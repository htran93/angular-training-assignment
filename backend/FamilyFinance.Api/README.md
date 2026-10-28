# Family Finance API

ASP.NET Core 8 + EF Core + SQLite.

## Run

```powershell
dotnet restore
dotnet build
dotnet run
```

The application applies pending EF Core migrations at startup. Open the Swagger URL printed in the terminal, normally `/swagger`.

## Monthly planning API

Get the backend-owned default jars:

```http
GET /api/v1/budget-plans/default-jars
```

Create one plan for a year and month. Income is a positive whole-VND digit string; jar definitions and calculated amounts are supplied by the backend.

```http
POST /api/v1/budget-plans
Content-Type: application/json

{"year":2026,"month":9,"monthlyIncomeVnd":"30000000"}
```

Read the saved plan and its seven allocations:

```http
GET /api/v1/budget-plans/2026/9
```
