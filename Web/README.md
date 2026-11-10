# Clipbook Web

Next.js frontend for Clipbook AI. The app proxies `/api/*` to the backend so browser requests and httpOnly auth cookies use the frontend origin.

## Run locally

1. Copy `.env.example` to `.env.local` and set `API_ORIGIN` to the API server URL.
2. Set the API's `FRONTEND_URL` to the frontend origin (default `http://localhost:3000`).
3. From this folder, run `npm install` and `npm run dev`.

The frontend includes cookie-based login and registration, dashboard, notebooks, extraction history and URL/image extraction, notebook Markdown editing, extraction chat, and search.

## Data and error handling

Read-only page data is loaded in App Router Server Components through feature API modules and `shared/api/server.ts`. The server adapter forwards only the httpOnly auth cookies and disables caching for user-specific responses. Client components receive the server result as initial query data and use the browser API client for interactive refreshes and mutations. Keep API paths inside the feature API modules; keep transport and cookie handling in `shared/api`.

The workspace has route-level error/loading boundaries, plus root error and global-error fallbacks. Server API 401 responses are left for the client session guard to refresh-and-retry; other server API failures are surfaced to the nearest error boundary.

For deployment, set `API_ORIGIN` to the public API origin in the frontend host and `FRONTEND_URL` to the frontend's origin in the API environment. The API and frontend must use HTTPS in production for secure cookies. Test long-running image extraction on the deployment tier early, since the frontend host may impose proxy/request time limits.
