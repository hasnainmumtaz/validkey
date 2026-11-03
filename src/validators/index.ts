import type { ValidationOptions, ValidationResult } from "./request.js";
import { validateOpenAI } from "./openai.js";
import { validateAnthropic } from "./anthropic.js";

export type ValidatorFn = (key: string, options?: ValidationOptions) => Promise<ValidationResult>;

export const validators: Record<string, ValidatorFn> = {
  openai: validateOpenAI,
  anthropic: validateAnthropic,
};

export const envKeys: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

export function getValidator(service: string): ValidatorFn | undefined {
  const name = service.toLowerCase();
  return Object.hasOwn(validators, name) ? validators[name] : undefined;
}

export function getSupportedServices(): string[] {
  return Object.keys(validators);
}
