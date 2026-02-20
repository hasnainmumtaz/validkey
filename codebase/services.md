# Supported services and adding new ones

## Supported services

| Service  | CLI name | Env variable    | Validation endpoint |
| -------- | -------- | ---------------- | -------------------- |
| **OpenAI** | `openai` | `OPENAI_API_KEY` | `GET https://api.openai.com/v1/models` with `Authorization: Bearer <key>`. Valid if 200; invalid if 401, 403, or request error. |

## Adding a new service

1. **Create a validator** in `src/validators/<service>.ts` that exports a single async function:
   - Signature: `(key: string) => Promise<{ valid: boolean; message?: string }>`.
   - Perform one minimal read-only request (e.g. list models or no-op).
   - Return `{ valid: true }` on 2xx; `{ valid: false, message: "..." }` on 401/403 or on network/unexpected errors.

2. **Register the validator** in `src/validators/index.ts`: add the service name and function to the `validators` map, and the env variable name (e.g. `ANTHROPIC_API_KEY`) to the `envKeys` map so `validkey <service>` can read the key from the environment.

3. **Document** the service and its env variable in this file and in [validation.md](validation.md). Update [cli.md](cli.md) if the help text lists services.

No secrets in the repo; keys only from CLI args or environment.
