export type RecoveryEntry = { key: string; createdAt: number | null };
export function recoveryEntries(keys: string[]): RecoveryEntry[] {
  return keys.filter((key) => key.startsWith("recovery-")).map((key) => {
    const timestamp = /^recovery-(\d{13})-/.exec(key)?.[1];
    const createdAt = timestamp ? Number(timestamp) : null;
    return { key, createdAt };
  }).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || b.key.localeCompare(a.key));
}
