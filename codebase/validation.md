# Validation behavior

Each provider is checked with one read-only models-list request. No model inference is requested. Success confirms access to that endpoint at that moment, not billing, quota, or permission to use every model.

## Contract

Provider functions accept `(key: string, options?: ValidationOptions)` and return `Promise<ValidationResult>`. Shared types and request handling live in `src/validators/request.ts`. `ValidationOptions` accepts `timeoutMs`, defaulting to 10000. The existing boolean `valid` is retained and now accompanied by `status`, `message`, and optional `httpStatus`.

| Status | Meaning |
| --- | --- |
| `accepted` | The models request returned 2xx. |
| `unauthorized` | HTTP 401: authentication failed. |
| `permission_denied` | HTTP 403: access denied; not proof of an invalid credential. |
| `rate_limited` | HTTP 429: provider rate or quota limit; verification is inconclusive. |
| `provider_error` | HTTP 5xx: provider failed; verification is inconclusive. |
| `unexpected_response` | Another unsuccessful HTTP response; verification is inconclusive. |
| `network_error` | No usable response, including connection, TLS, or blocked redirect failures. |
| `timeout` | The request deadline elapsed and the request was aborted. |
| `input_error` | Missing or invalid input, including an invalid timeout. |

CLI-only statuses are `unsupported_service`, `usage_error`, and `cancelled`.

## Request handling

OpenAI uses `GET https://api.openai.com/v1/models` with a Bearer token. Anthropic uses `GET https://api.anthropic.com/v1/models` with `x-api-key` and `anthropic-version: 2023-06-01`. See [services.md](services.md).

Requests have an AbortController deadline and do not follow redirects. They are not retried automatically. Unused response bodies are cancelled. All paths clear the deadline timer. Response bodies, HTTP status text, exception details, and supplied credentials are never printed in results.

Tests mock fetch and terminal input using fake credentials. They cover response classification, aborts, timer cleanup, credential redaction, key input, and CLI output modes without calling a live provider.
