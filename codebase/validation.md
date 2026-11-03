# Validation behavior

Each service is checked with one read-only models-list request. No model inference is requested. Provider permissions and service policies still apply.

## Contract

Every validator is an async function:

`(key: string) => Promise<{ valid: boolean; message?: string }>`

- **valid: true** – Key accepted by the service (2xx response).
- **valid: false** – Key rejected (401/403) or request failed; `message` may contain a short reason (e.g. "Invalid key", "Network error").

## Per-service details

See the table and implementation in [services.md](services.md). Summary:

| Service  | Endpoint / method                | Accepted if | Check fails if            |
| -------- | --------------------------------- | -------- | ------------------------- |
| **OpenAI** | `GET https://api.openai.com/v1/models` with `Authorization: Bearer <key>` | 2xx | Non-2xx or request error |
| **Anthropic** | `GET https://api.anthropic.com/v1/models` with `x-api-key` and `anthropic-version` | 2xx | Non-2xx or request error |

Network or unexpected errors should return `valid: false` with an appropriate `message`.

The boolean describes this check's result. A network failure does not prove a key is invalid, and 403 may indicate insufficient permissions. Success does not establish billing status, quota, or access to every model. The current implementation has no explicit request timeout or retries. Tests mock fetch and never use live credentials.
