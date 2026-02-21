# CLI interface

## Usage

- `validkey <service> <key>` – Validate `key` for the given `service`.
- `validkey <service>` – Read the key from the environment (e.g. `OPENAI_API_KEY` for `openai`). Exits with an error if the variable is missing.

## Options

- `--quiet`, `-q` – Only exit code; no stdout (for scripts).
- `--help`, `-h` – List supported services and usage.

## Output and exit codes

- **Success:** Print one line (e.g. "Valid" or "Key is valid") and exit with code `0`.
- **Invalid key or error:** Print one line (e.g. "Invalid" or the validator’s message) and exit with code `1`.
- **Unknown service:** Print "Unknown service: &lt;name&gt;" and exit with code `1`.
- **Missing key (when using env):** Print a clear error and exit with code `1`.

## Supported services

**openai**, **anthropic**. See [services.md](services.md) for the full list and how to add more.
