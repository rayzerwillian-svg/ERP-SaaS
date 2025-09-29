# Quality Assurance Report

## Summary
- Executed repository linting and test suites after installing workspace dependencies.
- Identified a critical configuration defect preventing the web client from reaching the API when using default settings.
- Noted absence of automated tests despite extensive surface area, leaving core business flows without regression coverage.

## Test Execution
| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | ✅ Pass | Lint succeeds once workspace dependencies are installed. |
| `pnpm test` | ⚠️ Pass w/ gaps | Command succeeds but prints "No tests defined" for the API workspace, demonstrating lack of coverage. |

> Turbo is downloaded transiently via `pnpm dlx`; no changes are required in source control after removing generated artifacts.

## Findings
1. **API base URL mismatch blocks all calls in default setup**  
   - The web client hardcodes `http://localhost:3333` when `API_URL` variables are absent, while the NestJS server listens on port `3000` by default.  
   - Result: vanilla `pnpm dev` sessions have the frontend sending every request (including `/auth/login`) to the wrong port, causing connection failures until administrators override environment variables.  
   - **Evidence:** default base URL in `apps/web/lib/api-client.ts`; Nest bootstrap listens on port `process.env.PORT || 3000` in `apps/api/src/main.ts`.
2. **Automated test suite missing despite broad scope**  
   - `pnpm test` completes without executing assertions, logging "No tests defined" for the API workspace.  
   - This leaves all critical modules (cadastros, fiscal, IA, compliance, etc.) unverified during CI runs, so regressions will slip through despite the workflow reporting success.  
   - **Evidence:** API test script prints the placeholder message during QA run.

## Recommendations
- Align the default API port across services (e.g., change frontend default to `http://localhost:3000` or update Nest to listen on `3333`) so local setups work out of the box.
- Implement high-priority integration tests covering authentication, cadastros CRUD, fiscal ingestion, and AI endpoints to ensure CI meaningfully gates changes.
