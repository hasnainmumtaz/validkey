# Changelog

## 1.1.0 (2026-11-04)

- Add distinct result statuses for accepted requests, authentication and permission failures, rate limits, provider failures, network errors, and timeouts.
- Add `--timeout <ms>` with a 10-second default and cancellation of stalled requests.
- Add `--json` with stable status codes and safe diagnostics for automation. `--quiet` continues to suppress output and takes precedence over JSON.
- Add `--stdin` for piped keys and `--prompt` for hidden terminal entry, including cancellation and terminal restoration.
- Reject inherited provider names, ambiguous key sources, and excess arguments.
- Avoid echoing credentials through parser errors, network exceptions, and provider responses. Do not follow request redirects.
- Preserve existing provider names, environment variables, positional keys, success text, and validation exit codes (0 and 1).
- Expand offline tests for validation, CLI behavior, and terminal input. No new runtime dependencies.

## 1.0.1

- Correct the npm repository URL.
