# validkey

[![npm version](https://img.shields.io/npm/v/validkey)](https://www.npmjs.com/package/validkey)
[![CI](https://github.com/hasnainmumtaz/validkey/actions/workflows/ci.yml/badge.svg)](https://github.com/hasnainmumtaz/validkey/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Check whether an API key works, without writing another validation script.

## Why I built it

I kept needing to check whether an API key was working. Each time, I had to write the same validation code again. I built Validkey to turn that repeated task into a single command I could reuse from my terminal or scripts.

> Version 1.1.0 is being prepared on `main`. The new options below are available from source; npm still serves 1.0.1 until the release is published.

## Quick start

Requires Node.js 18 or later. Development and CI use Node.js 22 and 24.

With `OPENAI_API_KEY` already set in your environment:

```sh
npx validkey openai
```

Successful output:

```text
Valid
```

For regular use:

```sh
npm install -g validkey
validkey openai
validkey anthropic
```

## Supported services

| Service | Command | Environment variable |
| --- | --- | --- |
| OpenAI | `validkey openai` | `OPENAI_API_KEY` |
| Anthropic | `validkey anthropic` | `ANTHROPIC_API_KEY` |

Validkey makes one read-only request to the selected provider's models endpoint. It does not generate model output or send the key to a Validkey server. See [validation details](codebase/validation.md).

## Usage

```text
validkey <service> [key] [options]
```

Service names are case-insensitive. Without an input option, a positional key takes precedence over the matching environment variable. Prefer environment variables, stdin, or hidden input: positional keys can appear in shell history and process listings. Use only keys you are authorized to check.

| Option | Behavior |
| --- | --- |
| `--prompt` | Enter a key in a terminal without showing it. |
| `--stdin` | Read one key from piped input until EOF. |
| `--timeout <ms>` | Request deadline in milliseconds, default 10000. |
| `--json` | Print one structured result to stdout. |
| `-q`, `--quiet` | Suppress result and error output; overrides JSON. |
| `-h`, `--help` | Show usage and supported services. |

```sh
validkey openai --prompt
validkey anthropic --json --timeout 5000
```

For a pipeline, have your secret manager write a key directly into `validkey openai --stdin --json`. Stdin accepts one key with optional surrounding whitespace, up to 16 KiB. It never reads your environment file automatically or stores the key.

`--stdin` and `--prompt` override the provider environment variable. Choose one input option and omit the positional key when using it. Hidden input requires a terminal and cannot be combined with JSON or quiet mode. Enter submits; Backspace edits; Ctrl+U clears; Ctrl+C or Ctrl+D cancels. Nothing prompts automatically.

Example for a POSIX shell, with the key supplied through the environment:

```sh
if validkey openai --quiet; then
  echo "Credential check passed"
else
  echo "Credential check failed; inspect the error before continuing"
fi
```

## What the result means

Exit **0** means the provider accepted the validation request. Exit **1** means the check failed or could not be completed, including usage errors. Successful text output remains `Valid`; error text goes to stderr.

A successful check confirms access to the models endpoint at that moment. It does not guarantee billing status, quota, or permission to use every model. A failed check alone does not prove the key is invalid.

| JSON status | Meaning |
| --- | --- |
| `accepted` | The provider accepted the models request. |
| `unauthorized` | Authentication failed (HTTP 401). |
| `permission_denied` | Access denied (HTTP 403); check permissions. |
| `rate_limited` | Rate or quota limit (HTTP 429); could not verify. |
| `provider_error` | Provider failure (HTTP 5xx); could not verify. |
| `unexpected_response` | Another unsuccessful HTTP response. |
| `network_error` | Connection failed or a redirect was blocked. |
| `timeout` | The request exceeded the configured deadline. |
| `input_error` | Missing or invalid key input or timeout. |
| `unsupported_service` | The provider is not supported. |
| `usage_error` | Invalid arguments or conflicting options. |
| `cancelled` | Hidden entry was cancelled. |

Example from `validkey openai --json`:

```json
{"service":"openai","valid":true,"status":"accepted","message":"Key accepted for model listing.","httpStatus":200}
```

JSON is also emitted on failed checks and usage errors. `service` is null if the provider could not be resolved; `httpStatus` is omitted when no HTTP response was received. `valid` describes the check result, not every possible use of the credential. Use `status` for automation rather than parsing human messages. Help remains human-readable.

The timeout accepts a positive integer up to 2147483647 ms and applies to the HTTP request, not waiting for key input. Requests are not retried automatically. Provider response bodies, raw exceptions, and supplied keys are never included in results. See the [CLI reference](codebase/cli.md) and [changelog](CHANGELOG.md).

## Contributing

Bug reports, documentation improvements, and new provider validators are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, tests, provider requirements, and pull requests.

```sh
git clone https://github.com/hasnainmumtaz/validkey.git
cd validkey
npm ci
npm test
```

Tests use fake keys and mocked HTTP responses. No provider accounts or real credentials are needed. The [codebase guide](codebase/codebase.md) describes the implementation.

## Community and security

- [Code of conduct](CODE_OF_CONDUCT.md)
- [Report a bug](https://github.com/hasnainmumtaz/validkey/issues/new?template=bug_report.md)
- [Suggest a feature or provider](https://github.com/hasnainmumtaz/validkey/issues/new?template=feature_request.md)
- [Get help](SUPPORT.md)
- [Report a vulnerability privately](SECURITY.md)

Do not include API keys in issues, pull requests, screenshots, or logs.

## License

MIT. See [LICENSE](LICENSE).
