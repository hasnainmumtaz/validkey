/**
 * OpenAI API key validator.
 * GET https://api.openai.com/v1/models with Bearer token; 200 = valid, 401/403 = invalid.
 */
export type ValidationResult = {
    valid: boolean;
    message?: string;
};
export declare function validateOpenAI(key: string): Promise<ValidationResult>;
