"""Family-preview speech from the Mac's installed Samantha voice; no network.

Replace/review speech rights and recordings before any public distribution.
Feedback tones are original generated waveforms and have no external assets.
"""
from pathlib import Path
import concurrent.futures, json, math, re, subprocess, tempfile, wave, struct, argparse

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets/audio'
OUT.mkdir(parents=True,exist_ok=True)
# WORDS is a JSON-compatible literal; do not silently erase mappings if its format changes.
source=(ROOT/'src/games/words.ts').read_text()
match=re.search(r'export const WORDS = (\[.*?\]) as const;', source, re.S)
if not match: raise RuntimeError('Could not locate the curated WORDS array')
word_rows=json.loads(re.sub(r',\s*([\]\}])', r'\1', match.group(1)))
if len(word_rows) < 40: raise RuntimeError('Unexpectedly small word list')
speech={word.lower():word.lower() for word,_,_ in word_rows}
for word,_,clue in word_rows:
    speech[f'clue-{word.lower()}']=clue
parser=argparse.ArgumentParser()
parser.add_argument('--manifest', action='store_true', help='Print speech text without generating or changing any assets')
parser.add_argument('--only', help='Regenerate exactly one existing speech clip without changing the source map')
args=parser.parse_args()
speech.update({
  'instructions-tic-tac-toe':'Take turns placing your shape in an empty square. Make three in a row, across, down, or diagonally. You can ask for a hint.',
  'instructions-word-rescue':'Choose letters to discover the secret word. In Challenge, six different wrong letters end the round. Find the word before the picture is complete. You may reveal one letter for help; that makes an assisted win. A correct letter reveals every place it belongs. In Practice, you can keep trying with no guess limit.',
  'instructions-memory':'Tap two cards. If their pictures match, the pair stays open. If they are different, look carefully. Turn them over when you are ready, and try again.',
  'instructions-checkers':'Red goes first. Tap a piece, then its next square. Ordinary pieces move and jump diagonally forward. Friendly games let you choose a jump or move another piece. Classic games require a jump whenever one is available. In both games, finish a jump chain with the same piece. Reach the far row to earn a king. Kings move forward and backward. Try the four little lessons below the board.',
  'instructions-maze':'Start at the boat and find your way to the flag. Tap a neighboring square, or use the arrow buttons. You cannot cross a wall. Go back whenever you like. A hint shows the next step.',
  'instructions-numbers':'Roll the dice. Tap open numbers that add up to your roll. For example, a roll of five can close five, or two and three. Close every number to clear the island. You can ask for a combination hint.',
})

speech.update(json.loads((ROOT/"scripts/explore-audio.json").read_text()))
speech.update(json.loads((ROOT/"scripts/lab-audio.json").read_text()))
# Learning games: one JSON map per slice (scripts/learn/<slice>.json), each written to its own module.
learn_maps={}
for learn_file in sorted((ROOT/"scripts/learn").glob("*.json")):
    learn_map=json.loads(learn_file.read_text())
    clash=[k for k in learn_map if k in speech]
    if clash: raise RuntimeError(f"{learn_file.name}: keys already used elsewhere: {clash[:5]}")
    learn_maps[learn_file.stem]=learn_map
    speech.update(learn_map)
speech.update(json.loads((ROOT/"scripts/quality-audio.json").read_text()))

if args.manifest:
    print(json.dumps(speech,ensure_ascii=False,sort_keys=True))
    raise SystemExit(0)

def speak(item):
    key,text=item
    target=OUT/f'{key}.m4a'
    if target.exists(): return
    # A macOS speech worker can stall. Bound each attempt and publish only a
    # completed clip so a retry never mistakes a partial file for usable audio.
    for attempt in range(3):
        try:
            with tempfile.TemporaryDirectory() as temp:
                aiff=Path(temp)/'speech.aiff'
                encoded=Path(temp)/'speech.m4a'
                subprocess.run(['say','-v','Samantha','-r','155','-o',str(aiff),text],check=True,timeout=30)
                subprocess.run(['afconvert','-f','m4af','-d','aac','-b','48000',str(aiff),str(encoded)],check=True,timeout=30)
                encoded.replace(target)
            return
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            if attempt == 2: raise

if args.only:
    if args.only not in speech: raise ValueError('Unknown speech clip')
    (OUT/f'{args.only}.m4a').unlink(missing_ok=True)
    speak((args.only,speech[args.only]))
    print(f'Regenerated {args.only}; all other audio and mappings preserved.')
    raise SystemExit(0)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(speak,speech.items()))

for name,notes in {'tap':[600],'match':[523.25,659.25],'win':[523.25,659.25,783.99,1046.5]}.items():
    samples=[]
    for frequency in notes:
        for i in range(6500):
            t=i/22050
            env=math.sin(math.pi*i/6500)**2
            samples.append(int(5000*math.sin(2*math.pi*frequency*t)*env))
    with wave.open(str(OUT/f'{name}.wav'),'w') as output:
        output.setparams((1,2,22050,0,'NONE','not compressed'))
        output.writeframes(struct.pack('<'+'h'*len(samples),*samples))

mapping=ROOT/'src/content/audioSources.ts'
existing=mapping.read_text()
has=lambda key: re.search(r"['\"]"+re.escape(key)+r"['\"]\s*:", existing)
word_keys=[key for word,_,_ in word_rows for key in (word.lower(), f'clue-{word.lower()}')]
missing_words=[key for key in word_keys if not has(key)]
# Every other generated clip (instructions, Explore, labs, guidance) must be mapped too, or it never plays.
learn_keys={key for learn_map in learn_maps.values() for key in learn_map}
missing_other=[key for key in speech if key not in word_keys and key not in learn_keys and not has(key)]
line=lambda key: f"  '{key}': require('../../assets/audio/{key}.m4a'),"
# Words go in the existing word section, before instruction clips; others append at the end. Existing mappings are preserved.
anchor=existing.index("  'instructions-")
existing=existing[:anchor]+''.join(line(k)+'\n' for k in missing_words)+existing[anchor:]
end=existing.rindex('};')
existing=existing[:end]+''.join(line(k)+'\n' for k in missing_other)+existing[end:]
mapping.write_text(existing)
print(f'Added {len(missing_words)} word and {len(missing_other)} other audio mappings; existing mappings preserved.')

# Write each learning slice's module (keys sorted for stable diffs).
for stem,learn_map in learn_maps.items():
    lines=''.join(f"  '{key}': require('../../../assets/audio/{key}.m4a'),\n" for key in sorted(learn_map))
    (ROOT/f'src/content/learnAudio/{stem}.ts').write_text(f"// Bundled learning speech for the {stem} slice. Generated by scripts/generate-audio.py from scripts/learn/{stem}.json.\nconst sources: Record<string, number> = {{\n{lines}}};\nexport default sources;\n")
print(f'Wrote {len(learn_maps)} learning speech modules.')
