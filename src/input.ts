import { emitKeypressEvents, type Key } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { ReadStream } from "node:tty";

const MAX_KEY_BYTES = 16_384;

export class KeyInputError extends Error {
  constructor(message: string, public readonly status: "input_error" | "cancelled" = "input_error") {
    super(message);
  }
}

function normalizeKey(value: string): string {
  const key = value.trim();
  if (/[\r\n]/.test(key)) throw new KeyInputError("Provide one key on a single line.");
  if (Buffer.byteLength(key) > MAX_KEY_BYTES) throw new KeyInputError("Key input is too long.");
  return key;
}

/** Explicit stdin mode reads one key to EOF, without printing it. */
export async function readKeyFromStdin(input: Readable = process.stdin): Promise<string> {
  if ((input as ReadStream).isTTY) {
    throw new KeyInputError("Pipe a key into --stdin, or use --prompt for hidden terminal input.");
  }
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of input) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_KEY_BYTES) throw new KeyInputError("Key input is too long.");
      chunks.push(buffer);
    }
  } catch (error) {
    if (error instanceof KeyInputError) throw error;
    throw new KeyInputError("Could not read the key from stdin.");
  }
  return normalizeKey(Buffer.concat(chunks).toString("utf8"));
}

/** Raw terminal mode disables echo. Always restore it on completion or cancellation. */
export function promptForKey(input: ReadStream = process.stdin, output: Writable = process.stderr): Promise<string> {
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    return Promise.reject(new KeyInputError("Hidden input requires a terminal. Use --stdin or an environment variable."));
  }
  return new Promise((resolve, reject) => {
    const wasRaw = input.isRaw;
    const wasFlowing = input.readableFlowing;
    let value = "";
    let settled = false;
    const finish = (error?: KeyInputError) => {
      if (settled) return;
      settled = true;
      input.removeListener("keypress", onKey);
      input.removeListener("end", onEnd);
      input.removeListener("error", onError);
      process.removeListener("SIGINT", onCancel);
      process.removeListener("SIGTERM", onCancel);
      if (!wasFlowing) input.pause();
      // stdin.pause() stops the native read on the next tick. Restore cooked
      // mode afterwards so a pending Windows console read cannot block output.
      setImmediate(() => {
        try {
          input.setRawMode(wasRaw);
          output.write("\n");
          if (error) reject(error);
          else resolve(normalizeKey(value));
        } catch (inputError) {
          reject(inputError instanceof KeyInputError ? inputError : new KeyInputError("Could not finish hidden input."));
        } finally {
          value = "";
        }
      });
    };
    const onCancel = () => finish(new KeyInputError("Key entry cancelled.", "cancelled"));
    const onEnd = () => finish(new KeyInputError("Input ended before a key was submitted."));
    const onError = () => finish(new KeyInputError("Could not read terminal input."));
    const onKey = (text: string | undefined, key: Key = {}) => {
      if (settled) return;
      if (key.ctrl && (key.name === "c" || key.name === "d")) return onCancel();
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") { value = Array.from(value).slice(0, -1).join(""); return; }
      if (key.ctrl && key.name === "u") { value = ""; return; }
      if (key.ctrl || key.meta || !text || /[\x00-\x1f\x7f]/.test(text)) return;
      value += text;
      if (Buffer.byteLength(value) > MAX_KEY_BYTES) finish(new KeyInputError("Key input is too long."));
    };
    try {
      input.setRawMode(true);
      emitKeypressEvents(input);
      input.on("keypress", onKey);
      input.once("end", onEnd);
      input.once("error", onError);
      process.once("SIGINT", onCancel);
      process.once("SIGTERM", onCancel);
      output.write("API key (hidden): ");
      input.resume();
    } catch {
      finish(new KeyInputError("Could not start hidden input."));
    }
  });
}
