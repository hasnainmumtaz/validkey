# Validation behavior

Each service is validated by making one minimal, read-only HTTP request. No heavy or billable API calls.

## Contract

Every validator is an async function:

`(key: string) => Promise<{ valid: boolean; message?: string }>`

- **valid: true** – Key accepted by the service (2xx response).
- **valid: false** – Key rejected (401/403) or request failed; `message` may contain a short reason (e.g. "Invalid key", "Network error").

## Per-service details

See the table and implementation in [services.md](services.md). Summary:

| Service  | Endpoint / method                | Valid if | Invalid if                |
| -------- | --------------------------------- | -------- | ------------------------- |
| **OpenAI** | `GET https://api.openai.com/v1/models` with `Authorization: Bearer <key>` | 200      | 401, 403, or request error |
| **Anthropic** | `GET https://api.anthropic.com/v1/models` with `x-api-key` and `anthropic-version` | 200      | 401, 403, or request error |

Network or unexpected errors should return `valid: false` with an appropriate `message`.
