export async function exportBackup(_text: string): Promise<void> {
  throw new Error("Backup export unavailable on this platform.");
}
export async function importBackup(): Promise<string | null> {
  return null;
}
