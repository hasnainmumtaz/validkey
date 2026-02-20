#!/usr/bin/env node
"use strict";
/**
 * Keycheck CLI – validate API keys for services like OpenAI.
 * Usage: validkey <service> [key] [--quiet]
 * Key can be passed as argument or read from env (e.g. OPENAI_API_KEY for openai).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const index_js_1 = require("./validators/index.js");
commander_1.program
    .name("validkey")
    .description("Validate API keys for services like OpenAI")
    .argument("<service>", "Service to validate (e.g. openai)")
    .argument("[key]", "API key (optional if set in env)")
    .option("-q, --quiet", "Only exit code, no stdout")
    .action(async (service, keyArg, opts) => {
    const validator = index_js_1.validators[service.toLowerCase()];
    if (!validator) {
        if (!opts.quiet) {
            console.error(`Unknown service: ${service}`);
        }
        process.exitCode = 1;
        return;
    }
    const envVar = index_js_1.envKeys[service.toLowerCase()];
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
commander_1.program.addHelpText("after", `
Supported services: ${(0, index_js_1.getSupportedServices)().join(", ")}

Examples:
  validkey openai sk-...
  validkey openai              (uses OPENAI_API_KEY from env)
  validkey openai --quiet      (exit 0/1 only, for scripts)
`);
commander_1.program.parse();
