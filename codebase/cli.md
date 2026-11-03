# CLI interface

```text
validkey <service> [key] [options]
```

Service names are case-insensitive. Only explicitly registered providers are accepted.

## Key sources

- With no input option, a positional key takes precedence over the provider environment variable.
- `--stdin` reads one key until EOF, trims surrounding whitespace, and rejects multiline or oversized input (16 KiB maximum). It ignores the provider environment variable and requires piped input.
- `--prompt` reads hidden terminal input. Enter submits, Backspace edits, Ctrl+U clears, and Ctrl+C or Ctrl+D cancels. Terminal mode is restored on completion or failure. It ignores the provider environment variable and fails when no terminal is available.
- Do not combine a positional key with `--stdin` or `--prompt`, or combine both input options. Hidden prompting cannot be combined with `--quiet` or `--json`.
- Nothing prompts automatically. Positional keys remain supported, but can appear in process listings and shell history.

## Options

| Option | Behavior |
| --- | --- |
| `--timeout <ms>` | Positive integer request deadline, default 10000, maximum 2147483647. Applies to the HTTP request, not waiting for human input or stdin EOF. |
| `--json` | One JSON result on stdout for validation and usage failures. Human diagnostic text is omitted. |
| `--quiet`, `-q` | Suppress result and error output. Takes precedence over JSON. |
| `--help`, `-h` | Show help instead of running a check. |

## Results

Exit 0 means the request succeeded. Exit 1 means it failed, could not be completed, or the invocation was invalid. Cancellation also exits 1. These validation exit codes are unchanged.

Default text output remains `Valid` on stdout for success; failures print a safe diagnostic on stderr. Do not parse human error messages; use JSON status codes. Help remains human-readable even when JSON or quiet is supplied.

JSON fields:

- `service`: canonical supported provider name, or null if no provider was resolved (including parser failures).
- `valid`: whether this particular request succeeded; false does not prove the credential is invalid.
- `status`: a stable code documented in [validation.md](validation.md).
- `message`: human-readable explanation, never raw provider response or exception text.
- `httpStatus`: present only if an HTTP response was received.

Example:

```json
{"service":"openai","valid":false,"status":"permission_denied","message":"Permission denied for model listing. This does not prove the key is invalid.","httpStatus":403}
```
