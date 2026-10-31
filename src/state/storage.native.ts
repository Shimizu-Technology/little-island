import { openDatabaseAsync } from "expo-sqlite";
import type { StorageAdapter } from "./storage";
import { recoveryKey } from "./recoveryKey";
import { recoveryEntries } from "./recoveryHistory";
const database = (async () => {
  const db = await openDatabaseAsync("little-island.db");
  await db.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);"
  );
  return db;
})();
export const storage: StorageAdapter = {
  get: async () => {
    const db = await database;
    return (
      (await db.getFirstAsync<{ value: string }>("SELECT value FROM app_data WHERE key = ?", "save"))?.value ?? null
    );
  },
  set: async (value) => {
    const db = await database;
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync("INSERT OR REPLACE INTO app_data (key,value) VALUES (?,?)", "save", value);
    });
  },
  preserve: async (value) => {
    const db = await database;
    await db.runAsync("INSERT INTO app_data (key,value) VALUES (?,?)", recoveryKey(), value);
  },
  listRecovery: async () => {
    const db = await database;
    const rows = await db.getAllAsync<{ key: string }>("SELECT key FROM app_data WHERE key LIKE ?", "recovery-%");
    return recoveryEntries(rows.map((row) => row.key));
  },
  readRecovery: async (key) => {
    if (!key.startsWith("recovery-")) return null;
    const db = await database;
    return (await db.getFirstAsync<{ value: string }>("SELECT value FROM app_data WHERE key = ?", key))?.value ?? null;
  },
};
