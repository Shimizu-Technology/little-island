export async function exportBackup(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" })),
    a = document.createElement("a");
  a.href = url;
  a.download = "little-island-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importBackup(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.oncancel = () => resolve(null);
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      if (file.size > 2_000_000) {
        reject(new Error("This backup is too large."));
        return;
      }
      file.text().then(resolve, reject);
    };
    input.click();
  });
}
