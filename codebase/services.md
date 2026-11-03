# Supported services and adding new ones

| Service | CLI name | Environment variable | Validation endpoint |
| --- | --- | --- | --- |
| OpenAI | `openai` | `OPENAI_API_KEY` | `GET https://api.openai.com/v1/models` with `Authorization: Bearer <key>` |
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` | `GET https://api.anthropic.com/v1/models` with `x-api-key` and `anthropic-version: 2023-06-01` |

Both use the shared request handler and [result semantics](validation.md). Permission to list models is required; lack of that permission does not establish that a credential is invalid.

## Adding a provider

1. Choose an official, minimal, read-only endpoint and document the permissions required. Do not perform billable inference simply to check a key.
2. Create a validator in `src/validators/` accepting `(key: string, options?: ValidationOptions)` and returning `Promise<ValidationResult>`. Use `checkEndpoint` with the fixed provider URL and authentication headers where its response semantics apply. If the provider has different semantics, document and test its mapping explicitly.
3. Register its name in `validators` and its environment variable in `envKeys`. Resolve names through `getValidator`, which checks own properties rather than inherited object members.
4. Test headers and destination, success, authentication, permissions, rate limits, provider failure, network errors, timeout, and safe diagnostics. Use fake credentials and mocked requests only.
5. Update the README and these docs.

Keys come from arguments, environment variables, explicit stdin, or hidden terminal input. Never print or commit them.
