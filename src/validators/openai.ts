import { checkEndpoint, type ValidationOptions, type ValidationResult } from "./request.js";
export type { ValidationOptions, ValidationResult } from "./request.js";

/** Check access to OpenAI's read-only models endpoint. */
export function validateOpenAI(key: string, options?: ValidationOptions): Promise<ValidationResult> {
  return checkEndpoint(key, "https://api.openai.com/v1/models", {
    Authorization: `Bearer ${key.trim()}`,
  }, options);
}
