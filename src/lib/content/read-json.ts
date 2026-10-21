import "server-only";
import { ImportError, type ImportErrorCode } from "./errors";

export async function readBoundedJson(
  body: Request | Response,
  maxBytes: number,
  tooLarge: ImportErrorCode,
  invalid: ImportErrorCode,
  signal?: AbortSignal,
): Promise<unknown> {
  const declaredLength = body.headers.get("content-length");
  if (declaredLength !== null && Number(declaredLength) > maxBytes) {
    await body.body?.cancel();
    throw new ImportError(tooLarge);
  }
  if (!body.body) throw new ImportError(invalid);

  const reader = body.body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    if (signal?.aborted) cancel();
    signal?.throwIfAborted();
    while (true) {
      const { done, value } = await reader.read();
      signal?.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ImportError(tooLarge);
      }
      chunks.push(value);
    }
  } finally {
    signal?.removeEventListener("abort", cancel);
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ) as unknown;
  } catch {
    throw new ImportError(invalid);
  }
}
