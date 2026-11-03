import { checkEndpoint, type ValidationOptions, type ValidationResult } from "./request.js";
export type { ValidationOptions, ValidationResult } from "./request.js";

/** Check access to Anthropic's read-only models endpoint. */
export function validateAnthropic(key: string, options?: ValidationOptions): Promise<ValidationResult> {
  return checkEndpoint(key, "https://api.anthropic.com/v1/models", {
    "x-api-key": key.trim(),
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
  }, options);
}
