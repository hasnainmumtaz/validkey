export type ValidationStatus =
  | "accepted"
  | "unauthorized"
  | "permission_denied"
  | "rate_limited"
  | "provider_error"
  | "unexpected_response"
  | "network_error"
  | "timeout"
  | "input_error";

export type ValidationResult = {
  /** Whether this request succeeded, not a verdict on every use of the key. */
  valid: boolean;
  status: ValidationStatus;
  message: string;
  httpStatus?: number;
};

export type ValidationOptions = { timeoutMs?: number };
export const DEFAULT_TIMEOUT_MS = 10_000;
export const MAX_TIMEOUT_MS = 2_147_483_647;

export function isValidTimeout(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_TIMEOUT_MS;
}

export async function checkEndpoint(
  key: string,
  url: string,
  headers: Record<string, string>,
  options: ValidationOptions = {},
): Promise<ValidationResult> {
  if (!key.trim()) {
    return { valid: false, status: "input_error", message: "Key is empty" };
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!isValidTimeout(timeoutMs)) {
    return { valid: false, status: "input_error", message: "Timeout must be a positive integer in milliseconds, at most 2147483647." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      // Never forward a credential to a redirected destination.
      redirect: "error",
    });
    // Only the response status is needed. Release the unread response body.
    void response.body?.cancel().catch(() => {});
    const httpStatus = response.status;
    if (response.ok) {
      return { valid: true, status: "accepted", message: "Key accepted for model listing.", httpStatus };
    }
    if (httpStatus === 401) {
      return { valid: false, status: "unauthorized", message: "Authentication failed. Check the key and provider account.", httpStatus };
    }
    if (httpStatus === 403) {
      return { valid: false, status: "permission_denied", message: "Permission denied for model listing. This does not prove the key is invalid.", httpStatus };
    }
    if (httpStatus === 429) {
      return { valid: false, status: "rate_limited", message: "Rate or quota limit reached. Could not verify the key; check provider limits before retrying.", httpStatus };
    }
    if (httpStatus >= 500) {
      return { valid: false, status: "provider_error", message: "Provider error. Could not verify the key; try again later.", httpStatus };
    }
    return { valid: false, status: "unexpected_response", message: `Unexpected HTTP response (${httpStatus}). Could not verify the key.`, httpStatus };
  } catch {
    // Provider bodies and exception text may contain credentials. Never echo them.
    return controller.signal.aborted
      ? { valid: false, status: "timeout", message: `Request timed out after ${timeoutMs} ms. Could not verify the key.` }
      : { valid: false, status: "network_error", message: "Connection failed. Could not verify the key; check your network and the provider endpoint." };
  } finally {
    clearTimeout(timer);
  }
}
