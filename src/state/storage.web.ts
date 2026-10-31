import type { StorageAdapter } from "./storage";
import { recoveryKey } from "./recoveryKey";
import { recoveryEntries } from "./recoveryHistory";
export const storage: StorageAdapter = {
  get: async () => localStorage.getItem("little-island.save"),
  set: async (value) => {
    localStorage.setItem("little-island.save", value);
  },
  preserve: async (value) => {
    localStorage.setItem(`little-island.${recoveryKey()}`, value);
  },
  listRecovery: async () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("little-island.recovery-")) keys.push(key.slice("little-island.".length));
    }
    return recoveryEntries(keys);
  },
  readRecovery: async (key) => key.startsWith("recovery-") ? localStorage.getItem(`little-island.${key}`) : null,
};
