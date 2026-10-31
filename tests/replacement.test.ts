import { it, expect } from "vitest";
import { preserveAndReplace } from "../src/state/replacement";
import type { StorageAdapter } from "../src/state/storage";
import { recoveryKey } from "../src/state/recoveryKey";
it("gives adjacent recovery snapshots distinct keys", () => {
  const keys = Array.from({ length: 100 }, () => recoveryKey());
  expect(new Set(keys).size).toBe(100);
});
function memory(initial: string | null) {
  let value = initial;
  const preserved: string[] = [];
  const adapter: StorageAdapter = {
    get: async () => value,
    set: async (next) => {
      value = next;
    },
    preserve: async (old) => {
      preserved.push(old);
    },
    listRecovery: async () => [],
    readRecovery: async () => null,
  };
  return { adapter, preserved, value: () => value };
}
it("preserves current progress on the first-ever restore after fresh install", async () => {
  const db = memory("played since install");
  await preserveAndReplace(db.adapter, "imported", "played since install");
  expect(db.preserved).toEqual(["played since install"]);
  expect(db.value()).toBe("imported");
});
it("preserves persisted and newest unsaved data before replacement", async () => {
  const db = memory("older persisted");
  await preserveAndReplace(db.adapter, "imported", "newest in memory");
  expect(db.preserved).toEqual(["older persisted", "newest in memory"]);
  expect(db.value()).toBe("imported");
});
it("will not overwrite if preserving the original fails", async () => {
  const db = memory("valuable original");
  db.adapter.preserve = async () => {
    throw new Error("disk full");
  };
  await expect(preserveAndReplace(db.adapter, "imported", null)).rejects.toThrow("disk full");
  expect(db.value()).toBe("valuable original");
});
it("preserves invalid raw data before explicitly starting fresh", async () => {
  const db = memory("{broken");
  await preserveAndReplace(db.adapter, "{}", null);
  expect(db.preserved).toEqual(["{broken"]);
});
