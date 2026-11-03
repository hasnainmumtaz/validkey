#!/usr/bin/env node
import { Command, CommanderError, InvalidArgumentError } from "commander";
import { envKeys, getSupportedServices, getValidator } from "./validators/index.js";
import { DEFAULT_TIMEOUT_MS, isValidTimeout, type ValidationResult } from "./validators/request.js";
import { KeyInputError, promptForKey, readKeyFromStdin } from "./input.js";

type Options = { quiet?: boolean; json?: boolean; stdin?: boolean; prompt?: boolean; timeout: number };
type CliResult = Omit<ValidationResult, "status"> & { status: ValidationResult["status"] | "unsupported_service" | "usage_error" | "cancelled" };

function report(result: CliResult, opts: Partial<Options>, service?: string): void {
  process.exitCode = result.valid ? 0 : 1;
  if (opts.quiet) return;
  if (opts.json) {
    console.log(JSON.stringify({ service: service ?? null, ...result }));
  } else if (result.valid) {
    // Preserve the original successful output for existing shell scripts.
    console.log("Valid");
  } else {
    console.error(result.message);
  }
}

const program = new Command()
  .name("validkey")
  .description("Check API key access to a provider's models endpoint")
  .argument("<service>", "Service to check (openai or anthropic)")
  .argument("[key]", "API key (prefer env, --stdin, or --prompt)")
  .option("-q, --quiet", "Suppress all result output; exit code only (overrides --json)")
  .option("--json", "Print one JSON result to stdout")
  .option("--timeout <ms>", "Request timeout in milliseconds", (value: string) => {
    if (!/^\d+$/.test(value) || !isValidTimeout(Number(value))) {
      throw new InvalidArgumentError("Timeout must be a positive integer in milliseconds, at most 2147483647.");
    }
    return Number(value);
  }, DEFAULT_TIMEOUT_MS)
  .option("--stdin", "Read one key from piped stdin until EOF")
  .option("--prompt", "Enter a key in a terminal without echoing it")
  .allowExcessArguments(false)
  .exitOverride()
  // Commander diagnostics can repeat secret argument values. Report safe errors below.
  .configureOutput({ writeErr: () => {} })
  .action(async (service: string, keyArg: string | undefined, opts: Options) => {
    const name = service.toLowerCase();
    const validator = getValidator(name);
    if (!validator) {
      report({ valid: false, status: "unsupported_service", message: `Unknown service. Supported services: ${getSupportedServices().join(", ")}.` }, opts);
      return;
    }
    const timeoutMs = opts.timeout;
    if ((opts.stdin && opts.prompt) || ((opts.stdin || opts.prompt) && keyArg !== undefined) || (opts.prompt && (opts.quiet || opts.json))) {
      report({ valid: false, status: "usage_error", message: "Choose one key source: argument, --stdin, or --prompt. Use --prompt without --quiet or --json." }, opts, name);
      return;
    }
    try {
      const key = opts.stdin ? await readKeyFromStdin()
        : opts.prompt ? await promptForKey()
        : (keyArg ?? process.env[envKeys[name]] ?? "").trim();
      if (!key) {
        report({ valid: false, status: "input_error", message: `No key provided. Set ${envKeys[name]}, use --stdin or --prompt, or pass a key argument.` }, opts, name);
        return;
      }
      report(await validator(key, { timeoutMs }), opts, name);
    } catch (error) {
      const result: CliResult = error instanceof KeyInputError
        ? { valid: false, status: error.status, message: error.message }
        : { valid: false, status: "input_error", message: "Could not read or check the key." };
      report(result, opts, name);
    }
  });

program.addHelpText("after", `
Supported services: ${getSupportedServices().join(", ")}

Examples:
  validkey openai                    (uses OPENAI_API_KEY)
  validkey anthropic --prompt        (hidden terminal input)
  validkey openai --stdin --json     (pipe a key from a secret manager)
  validkey openai --timeout 5000
  validkey openai --quiet            (exit 0/1 only)

A successful check confirms model-list access, not billing, quota, or every model.
`);

program.parseAsync().catch((error: unknown) => {
  if (error instanceof CommanderError && error.exitCode === 0) return;
  const args = process.argv.slice(2);
  const invalidTimeout = error instanceof CommanderError && error.code === "commander.invalidArgument";
  report({ valid: false, status: invalidTimeout ? "input_error" : "usage_error", message: invalidTimeout
    ? "Timeout must be a positive integer in milliseconds, at most 2147483647."
    : "Invalid command. Run validkey --help for usage." }, {
    json: args.includes("--json"), quiet: args.includes("--quiet") || args.includes("-q"),
  });
});
