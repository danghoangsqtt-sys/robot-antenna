# EVE Gemini Proxy

A minimal Node/Express proxy to forward browser requests to Google Gemini / Generative Language API. Use this when calling Gemini directly from the browser is blocked by CORS or when you want to keep your API key on the server.

Quick start

1. Copy `.env.example` to `.env` and add your `GEMINI_API_KEY`.
2. Install dependencies:

```bash
cd proxy
npm install
```

3. Start the server:

```bash
npm run start
```

By default the proxy listens on port `5174` and exposes:

- `POST /generate` — JSON body: `{ prompt: string, options?: { temperature?: number, maxTokens?: number } }`.

It will forward the request to the configured Gemini endpoint and return `{ text, raw }` where `text` is the best-effort extracted reply.

Security

- Keep this service private or behind authentication in production. The sample proxy is intentionally minimal for local development.
- Use firewall rules or network policies to limit access.

CORS

The proxy allows `ALLOWED_ORIGINS` (comma-separated) from .env. Default is `http://localhost:5173` (Vite dev server).

Notes

- Adjust `GEMINI_ENDPOINT` in `.env` if you are using a specific Gemini model or API version.
- This proxy is an example — extend with logging, rate-limiting, request validation, and auth for production use.
