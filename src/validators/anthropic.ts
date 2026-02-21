/**
 * Anthropic API key validator.
 * GET https://api.anthropic.com/v1/models with x-api-key; 200 = valid, 401/403 = invalid.
 */

export type ValidationResult = { valid: boolean; message?: string };

const ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models";
const ANTHROPIC_VERSION = "2023-06-01";

export async function validateAnthropic(key: string): Promise<ValidationResult> {
  if (!key || key.trim() === "") {
    return { valid: false, message: "Key is empty" };
  }

  try {
    const res = await fetch(ANTHROPIC_MODELS_URL, {
      method: "GET",
      headers: {
        "x-api-key": key.trim(),
        "Content-Type": "application/json",
        "anthropic-version": ANTHROPIC_VERSION,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { valid: false, message };
  }
}
