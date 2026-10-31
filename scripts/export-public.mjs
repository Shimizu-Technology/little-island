#!/usr/bin/env node
// A fresh source snapshot only. This tool never initializes Git or publishes anything.
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directories = ['src', 'assets', 'scripts', 'tests', 'modules'];
const files = ['app.json', 'eas.json', 'package.json', 'package-lock.json', 'tsconfig.json',
  'eslint.config.js', 'vitest.config.mts', 'LICENSE', 'THIRD_PARTY_NOTICES.md'];
const optional = ['babel.config.js', 'babel.config.cjs', 'metro.config.js', 'metro.config.cjs'];
const excluded = new Set(['.git', 'node_modules', '.expo', 'dist', '__pycache__', 'artifacts', 'docs']);
// Split private-name sentinels so the guard itself can be shipped and scanned.
const privateNames = [['sta', 'ssie'], ['le', 'on'], ['ca', 'mi']].map(parts => parts.join(''));
const privateName = new RegExp(`\\b(${privateNames.join('|')})\\b`, 'i');
const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const secret = /-----BEGIN (?:[A-Z ]*PRIVATE KEY|OPENSSH PRIVATE KEY)-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{12,}|sk-proj-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{12,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})/;
const credentialField = /["']?(?:ascApiKeyId|appStoreConnectApiKeyId|apiKeyId|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i;
const forbiddenFile = /(?:^|\/)(?:\.env(?:\..*)?|[^/]+\.(?:p8|p12|pem|key|mobileprovision)|credentials\.json)$/i;

function tree(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name), name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not exportable: ${name}`);
    if (entry.isDirectory()) return excluded.has(entry.name) ? [] : tree(path, name);
    if (!entry.isFile()) throw new Error(`Unsupported file: ${name}`);
    if (entry.name.endsWith('.pyc')) return [];
    return [name];
  });
}

export function scanFile(name, bytes) {
  if (forbiddenFile.test(name)) throw new Error(`Credential file: ${name}`);
  // Scan binary strings too: metadata must not carry private names or credentials.
  const text = /\.(?:m4a|wav|png)$/i.test(name)
    ? (bytes.toString('latin1').match(/[\x20-\x7e]{20,}/g) ?? []).join('\n')
    : bytes.toString('utf8');
  if (privateName.test(name) || privateName.test(text) || email.test(text) || /\/Users\//.test(text))
    throw new Error(`Privacy guard failed: ${name}`);
  if (secret.test(text) || credentialField.test(text)) throw new Error(`Secrets guard failed: ${name}`);
}

export function exportPublic(target) {
  if (!target) throw new Error('Usage: npm run export:public -- <new-target-directory>');
  const destination = resolve(target);
  const within = (parent, child) => {
    const path = relative(parent, child);
    return path === '' || (path !== '..' && !path.startsWith(`..${sep}`));
  };
  if (within(root, destination) || within(destination, root))
    throw new Error('Choose a target outside the source tree, not an ancestor of it.');
  if (existsSync(destination)) throw new Error('Target already exists; use a new directory.');
  mkdirSync(dirname(destination), { recursive: true });
  const canonical = join(realpathSync(dirname(destination)), basename(destination));
  if (within(root, canonical) || within(canonical, root)) throw new Error('Target resolves inside the source tree or its ancestor.');
  const staging = join(dirname(destination), `.${basename(destination)}-staging-${process.pid}`);
  if (existsSync(staging)) throw new Error('Staging directory already exists.');
  mkdirSync(staging);
  try {
    const paths = [...files, ...optional.filter(f => existsSync(join(root, f))),
      ...directories.flatMap(d => tree(join(root, d), d))];
    const receipt = JSON.parse(readFileSync(join(root, 'scripts/public-audio-receipt.json'), 'utf8'));
    const map = readFileSync(join(root, 'src/content/neuralAudio.ts'), 'utf8');
    const speech = new Set([...map.matchAll(/require\("\.\.\/\.\.\/assets\/(audio\/[^"\n]+\.m4a)"\)/g)].map(m => m[1]));
    const tones = new Set(['audio/tap.wav', 'audio/match.wav', 'audio/win.wav',
      ...['song-loop', 'reef-loop', 'sticker', 'coral', 'clear', ...Array.from({ length: 6 }, (_, i) => `shell-${i}`)].map(n => `arcade/${n}.wav`)]);
    if (receipt.speechReceipt.engine !== 'Kokoro-82M v1.0' || receipt.speechReceipt.modelLicense !== 'Apache-2.0' || speech.size !== receipt.speechReceipt.keysPerVoice * 2)
      throw new Error('Neural speech receipt and source map disagree.');
    const audio = new Set(paths.filter(p => /\.(?:m4a|wav|mp3|aac|aiff?|ogg|flac)$/i.test(p)).map(p => p.replace(/^assets\//, '')));
    for (const path of [...speech, ...tones]) if (!audio.has(path)) throw new Error(`Missing audio: ${path}`);
    for (const path of audio) {
      if (!speech.has(path) && !tones.has(path)) throw new Error(`Unreferenced or legacy audio: ${path}`);
      const bytes = readFileSync(join(root, 'assets', path));
      if (createHash('sha256').update(bytes).digest('hex') !== receipt.sha256[path])
        throw new Error(`Audio does not match verified generation receipt: ${path}`);
    }
    for (const path of paths) {
      if (!lstatSync(join(root, path)).isFile()) throw new Error(`Expected regular file: ${path}`);
      let bytes = readFileSync(join(root, path));
      if (path === 'app.json') {
        const config = JSON.parse(bytes);
        delete config.expo.ios.appleTeamId;
        delete config.expo.extra?.eas;
        delete config.expo.owner;
        // Contributors build their own app; never point at the family app's store identity.
        if (config.expo.ios) config.expo.ios.bundleIdentifier = 'com.example.littleisland';
        if (config.expo.android) config.expo.android.package = 'com.example.littleisland';
        config.expo.version = '1.0.0';
        if (config.expo.ios?.buildNumber) config.expo.ios.buildNumber = '1';
        if (config.expo.android?.versionCode) config.expo.android.versionCode = 1;
        bytes = Buffer.from(JSON.stringify(config, null, 2) + '\n');
      } else if (path === 'eas.json') {
        const config = JSON.parse(bytes);
        delete config.submit; // Contributors supply their own account, team and store app.
        bytes = Buffer.from(JSON.stringify(config, null, 2) + '\n');
      }
      scanFile(path, bytes);
      mkdirSync(dirname(join(staging, path)), { recursive: true });
      writeFileSync(join(staging, path), bytes);
    }
    const readme = readFileSync(join(root, existsSync(join(root, 'PUBLIC_README.md')) ? 'PUBLIC_README.md' : 'README.md'));
    scanFile('README.md', readme);
    writeFileSync(join(staging, 'README.md'), readme);
    renameSync(staging, destination);
    console.log(`Exported ${paths.length + 1} files to ${destination}. Privacy, secrets and ${audio.size} audio hashes passed. No Git history included.`);
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { exportPublic(process.argv[2]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
