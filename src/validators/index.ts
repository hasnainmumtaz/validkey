/**
 * Registry of service validators.
 * Each validator: (key: string) => Promise<{ valid: boolean; message?: string }>
 */

import type { ValidationResult } from "./openai.js";
import { validateOpenAI } from "./openai.js";

export type ValidatorFn = (key: string) => Promise<ValidationResult>;

export const validators: Record<string, ValidatorFn> = {
  openai: validateOpenAI,
};

export const envKeys: Record<string, string> = {
  openai: "OPENAI_API_KEY",
};

export function getSupportedServices(): string[] {
  return Object.keys(validators);
}
