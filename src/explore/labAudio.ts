import transcripts from "../../scripts/lab-audio.json";
export type LabAudioKey = keyof typeof transcripts;
/** Exact authored text lookup keeps the spoken feedback aligned with the current task. */
export function labAudioKey(message: string): LabAudioKey | undefined {
  return (Object.keys(transcripts) as LabAudioKey[]).find((key) => transcripts[key] === message);
}
