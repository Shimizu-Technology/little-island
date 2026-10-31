import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = execFileSync("python3", ["scripts/generate-audio.py", "--manifest"], { encoding: "utf8", timeout: 30000 }).trim();
const speech = JSON.parse(manifest) as Record<string, string>;
const map = readFileSync(new URL("../src/content/neuralAudio.ts", import.meta.url), "utf8");
const receipt = JSON.parse(readFileSync(new URL("./fixtures/neural-audio.json", import.meta.url), "utf8"));

describe("complete offline voice banks", () => {
  it("binds both voices to the current full speech manifest", () => {
    expect(Object.keys(speech).length).toBeGreaterThan(2700);
    expect(receipt.keysPerVoice).toBe(Object.keys(speech).length);
    expect(receipt.scriptManifestSHA256).toBe(createHash("sha256").update(manifest).digest("hex"));
    expect(receipt.voices).toEqual({ warm: "af_heart", calm: "af_bella" });
    expect(receipt.voiceDataSHA256).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.networkPlayback).toBe(false);
  });
  it("bundles every original and new spoken line for each voice", () => {
    const refs = [...map.matchAll(/require\("\.\.\/\.\.\/assets\/audio\/([^"\n]+\.m4a)"\)/g)].map(m => m[1]);
    const seen = new Set(refs);
    expect(seen.size).toBe(Object.keys(speech).length * 2);
    for (const prefix of ["", "calm/"]) for (const key of Object.keys(speech)) {
      const file = `${prefix}${key}.m4a`;
      expect(seen.has(file), file).toBe(true);
      const bytes = readFileSync(new URL(`../assets/audio/${file}`, import.meta.url));
      expect(bytes.length, file).toBeGreaterThan(1000);
      for (const box of ["ftyp", "mdat", "moov"]) expect(bytes.includes(Buffer.from(box)), `${file}: ${box}`).toBe(true);
    }
  });
});
