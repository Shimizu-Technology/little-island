import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
export async function exportBackup(text: string) {
  const uri = `${FileSystem.cacheDirectory}little-island-backup.json`;
  await FileSystem.writeAsStringAsync(uri, text);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable. Please try again on your device.");
  await Sharing.shareAsync(uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: "Save your Little Island backup",
  });
}
export async function importBackup(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "public.json"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  if ((result.assets[0].size ?? 0) > 2_000_000) throw new Error("This backup is too large.");
  return FileSystem.readAsStringAsync(result.assets[0].uri);
}
