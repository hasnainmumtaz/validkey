"use strict";
/**
 * OpenAI API key validator.
 * GET https://api.openai.com/v1/models with Bearer token; 200 = valid, 401/403 = invalid.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOpenAI = validateOpenAI;
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
async function validateOpenAI(key) {
    if (!key || key.trim() === "") {
        return { valid: false, message: "Key is empty" };
    }
    try {
        const res = await fetch(OPENAI_MODELS_URL, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${key.trim()}`,
            },
        });
        if (res.ok) {
            return { valid: true };
        }
        if (res.status === 401) {
            return { valid: false, message: "Invalid key or unauthorized" };
        }
        if (res.status === 403) {
            return { valid: false, message: "Forbidden" };
        }
        return {
            valid: false,
            message: `Unexpected response: ${res.status} ${res.statusText}`,
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        return { valid: false, message };
    }
}
