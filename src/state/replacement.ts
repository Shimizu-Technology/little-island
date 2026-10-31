import type { StorageAdapter } from "./storage";
// Caller drains pending writes and prevents new commits until this finishes.
export async function preserveAndReplace(adapter: StorageAdapter, replacement: string, current: string | null) {
  const original = await adapter.get();
  if (original) await adapter.preserve(original);
  if (current && current !== original) await adapter.preserve(current);
  await adapter.set(replacement);
}
