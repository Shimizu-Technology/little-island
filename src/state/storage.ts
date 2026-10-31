// Metro selects storage.native.ts on native platforms and storage.web.ts on web.
import type { RecoveryEntry } from "./recoveryHistory";
export type StorageAdapter = {
  get: () => Promise<string | null>;
  set: (value: string) => Promise<void>;
  preserve: (value: string) => Promise<void>;
  listRecovery: () => Promise<RecoveryEntry[]>;
  readRecovery: (key: string) => Promise<string | null>;
};
export const storage: StorageAdapter = {
  get: async () => null, set: async () => {}, preserve: async () => {},
  listRecovery: async () => [], readRecovery: async () => null,
};
