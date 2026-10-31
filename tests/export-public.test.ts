import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('public source export boundary', () => {
  it('exports a runnable tree with independent identifiers and rejects contaminated input atomically', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'island-export-test-'));
    const snapshot = join(scratch, 'snapshot');
    const run = (script: string, target: string) => execFileSync(process.execPath, [script, target], { encoding: 'utf8', stdio: 'pipe' });
    try {
      run(resolve('scripts/export-public.mjs'), snapshot);
      for (const name of ['src/app/index.tsx', 'modules/island-nearby/ios/IslandNearbyModule.swift', 'tests/fixtures/neural-audio.json', 'README.md', 'LICENSE']) expect(existsSync(join(snapshot, name)), name).toBe(true);
      for (const name of ['docs', '.git', 'node_modules', 'ios', 'android', 'dist', 'artifacts']) expect(existsSync(join(snapshot, name)), name).toBe(false);
      const app = JSON.parse(readFileSync(join(snapshot, 'app.json'), 'utf8'));
      expect(app.expo.ios.appleTeamId).toBeUndefined();
      // Also holds when the test runs inside an exported tree.
      expect(app.expo.ios.bundleIdentifier).toBe('com.example.littleisland');
      if (app.expo.android) expect(app.expo.android.package).toBe('com.example.littleisland');
      expect(app.expo.version).toBe('1.0.0');
      expect(app.expo.extra?.eas).toBeUndefined();
      expect(JSON.parse(readFileSync(join(snapshot, 'eas.json'), 'utf8')).submit).toBeUndefined();
      const script = join(snapshot, 'scripts/export-public.mjs');
      // The exported tool works without the private README or documentation.
      run(script, join(scratch, 'second'));
      expect(() => run(script, snapshot)).toThrow();
      expect(() => run(script, join(snapshot, '..nested'))).toThrow();
      const fixture = join(snapshot, 'scripts/guard-fixture.txt');
      const attempts = [
        ['privacy', ['Sta', 'ssie'].join('')],
        ['email', ['private', '@', 'example.org'].join('')],
        ['token', ['ghp_', 'a'.repeat(36)].join('')],
        ['key', ['-----BEGIN ', 'PRIVATE KEY-----'].join('')],
        ['store-key', JSON.stringify({ apiKeyId: 'A'.repeat(10) })],
      ];
      for (const [id, text] of attempts) {
        writeFileSync(fixture, text);
        const target = join(scratch, id);
        expect(() => run(script, target), id).toThrow();
        expect(existsSync(target), id).toBe(false);
      }
      rmSync(fixture);
      const credential = join(snapshot, 'scripts/.env');
      writeFileSync(credential, 'example');
      expect(() => run(script, join(scratch, 'env'))).toThrow();
      rmSync(credential);
      const extra = join(snapshot, 'assets/audio/legacy-unknown.m4a');
      writeFileSync(extra, 'not a verified neural clip');
      expect(() => run(script, join(scratch, 'unknown-audio'))).toThrow(/Unreferenced or legacy audio/);
      rmSync(extra);
      writeFileSync(join(snapshot, 'assets/audio/apple.m4a'), 'changed recording');
      expect(() => run(script, join(scratch, 'changed-audio'))).toThrow(/generation receipt/);
    } finally { rmSync(scratch, { recursive: true, force: true }); }
  });
});
