#!/usr/bin/env node
/**
 * Keycheck CLI – validate API keys for services like OpenAI.
 * Usage: validkey <service> [key] [--quiet]
 * Key can be passed as argument or read from env (e.g. OPENAI_API_KEY for openai).
 */

import { program } from "commander";
import { validators, envKeys, getSupportedServices } from "./validators/index.js";

program
  .name("validkey")
  .description("Validate API keys for services like OpenAI")
  .argument("<service>", "Service to validate (e.g. openai)")
  .argument("[key]", "API key (optional if set in env)")
  .option("-q, --quiet", "Only exit code, no stdout")
  .action(async (service: string, keyArg: string | undefined, opts: { quiet?: boolean }) => {
    const validator = validators[service.toLowerCase()];
    if (!validator) {
      if (!opts.quiet) {
        console.error(`Unknown service: ${service}`);
      }
      process.exitCode = 1;
      return;
    }

    const envVar = envKeys[service.toLowerCase()];
    const key = keyArg?.trim() ?? (envVar ? process.env[envVar] : undefined);

    if (!key) {
      if (!opts.quiet) {
        console.error(envVar
          ? `No key provided. Set ${envVar} or pass the key as second argument.`
          : "No key provided.");
      }
      process.exitCode = 1;
      return;
    }

    const result = await validator(key);
    if (result.valid) {
      if (!opts.quiet) {
        console.log("Valid");
      }
      process.exitCode = 0;
      return;
    }

    if (!opts.quiet) {
      console.error(result.message ?? "Invalid");
    }
    process.exitCode = 1;
  });

program.addHelpText("after", `
Supported services: ${getSupportedServices().join(", ")}

Examples:
  validkey openai sk-...
  validkey openai              (uses OPENAI_API_KEY from env)
  validkey openai --quiet      (exit 0/1 only, for scripts)
`);

program.parse();
