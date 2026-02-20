/**
 * Registry of service validators.
 * Each validator: (key: string) => Promise<{ valid: boolean; message?: string }>
 */
import type { ValidationResult } from "./openai.js";
export type ValidatorFn = (key: string) => Promise<ValidationResult>;
export declare const validators: Record<string, ValidatorFn>;
export declare const envKeys: Record<string, string>;
export declare function getSupportedServices(): string[];
