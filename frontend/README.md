# Family Finance Frontend

The frontend is a standalone Angular application. It uses Angular 21, TypeScript,
and Vitest.

## Prerequisites

- Node.js 22 or later
- npm 10.9.8 (the version pinned in `package.json`)
- The Family Finance API running locally for data-driven pages
- .NET 8 SDK only if you also need to run the API from this repository

Check your installed versions:

```powershell
node --version
npm --version
```

## API base URL

The frontend API base URL is configured in
[`src/environments/environment.ts`](./src/environments/environment.ts):

```ts
apiBaseUrl: 'https://localhost:54535'
```

Set `apiBaseUrl` to the origin of the API you want to use. Do not append
`/api/v1`; the frontend endpoint definitions add the API paths.

For local development, the API launch profile uses HTTPS on port `54535` and
HTTP on port `54536`. The frontend is configured to use HTTPS. The backend's
Development CORS policy must allow the frontend's origin; the default Angular
development origin is `http://localhost:4200`. If you use another host or port,
allow that exact origin in the backend CORS policy.

The repository also contains `src/environments/environment.prod.ts`, which
currently sets an empty API base URL for same-origin deployment. However,
`angular.json` does not currently configure a file replacement for production.
Do not assume a production build uses `environment.prod.ts`; configure and
verify the production API URL and Angular environment replacement before
deploying.

## Install dependencies

From the repository root:

```powershell
cd frontend
npm ci
```

## Run the frontend

From `frontend/`:

```powershell
npm start
```

Open [http://localhost:4200](http://localhost:4200). The development server
reloads when source files change.

## Run the API locally

If the API is not already running, open a separate terminal at the repository
root:

```powershell
cd backend\FamilyFinance.Api
dotnet restore
dotnet run
```

The API applies pending database migrations at startup. Its default launch
profile serves `https://localhost:54535` and `http://localhost:54536`, and
Swagger is available at [https://localhost:54535/swagger](https://localhost:54535/swagger).
If the browser reports an HTTPS certificate error, trust the local .NET
development certificate:

```powershell
dotnet dev-certs https --trust
```

## Test and build

Run the unit tests:

```powershell
npm test
```

Run tests with coverage:

```powershell
npm test -- --coverage --include="src/app/**/*.spec.ts"
```

Create a production build:

```powershell
npm run build
```

Build output is written to `dist/family-finance/`.
