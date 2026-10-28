---
name: Angular services and data access
description: Use when creating or modifying Angular services, API access, dependency injection, or RxJS flows.
applyTo: "frontend/src/**/*.service.ts,frontend/src/**/api/**/*.ts,frontend/src/**/data-access/**/*.ts"
---

# Angular Services and Data Access

- Inspect existing services, API models, HTTP interceptors, and nearby tests before implementation.
- Keep each service focused on a cohesive responsibility.
- Reuse configured Angular `HttpClient`, interceptors, environment configuration, and existing API abstractions.
- Do not introduce a new HTTP client, state-management library, or dependency without a concrete reason.
- Type request and response data; avoid `any` and narrow untrusted values appropriately.
- Follow the feature's existing use of RxJS, signals, promises, or another established approach.
- Avoid subscribing inside services when returning an Observable better fits the existing architecture.
- Handle errors deliberately and preserve useful diagnostic context without exposing internal details to users.
- Ensure subscriptions, event listeners, and other resources have appropriate cleanup.
- Never hardcode secrets or expose credentials in logs.
- Add Vitest coverage for success, failure, and relevant edge cases using the configured test environment.
