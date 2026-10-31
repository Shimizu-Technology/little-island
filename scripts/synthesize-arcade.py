#!/usr/bin/env python3
"""Original Island Arcade music and effects, synthesized locally; no speech or samples.
Reproduce: python3 scripts/synthesize-arcade.py. 22,050 Hz mono PCM, soft envelopes.
"""
import math, struct, wave
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1] / 'assets/arcade'
RATE = 22050
ROOT.mkdir(parents=True, exist_ok=True)
def write(name, events, length, gain=.22):
    samples = [0.] * int(length * RATE)
    for start, duration, hz, volume in events:
        for i in range(int(duration * RATE)):
            j = int(start * RATE) + i
            if j >= len(samples): break
            t = i / RATE
            env = min(1., t / .012) * max(0., 1 - t / duration) ** 2
            # A quiet second partial gives the wooden/shell tone its own gentle color.
            samples[j] += volume * env * (math.sin(2 * math.pi * hz * t) + .15 * math.sin(4 * math.pi * hz * t))
    with wave.open(str(ROOT / (name + '.wav')), 'w') as out:
        out.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
        out.writeframes(b''.join(struct.pack('<h', int(max(-.9, min(.9, s * gain)) * 32767)) for s in samples))
notes=[261.6256,293.6648,329.6276,391.9954,440.,523.2511]
for i, hz in enumerate(notes): write('shell-' + str(i), [(0,.48,hz,.8)], .55)
write('coral',[(0,.16,392,.7),(.035,.13,523,.35)],.22)
write('clear',[(i*.11,.42,hz,.7) for i,hz in enumerate([329.63,392,523.25])],.8)
write('sticker',[(i*.12,.5,hz,.7) for i,hz in enumerate([261.63,329.63,392,523.25])],1.1)
# Two original eight-bar motifs; silence at the end is part of the breathing loop.
for name, tune, bass in [('reef-loop',[0,2,3,2,1,0,3,4,3,2,1,2,0,1,2,0],130.8128),('song-loop',[3,2,0,1,2,4,3,2,1,0,2,3,4,3,1,0],146.8324)]:
    events=[(i*.5,.46,notes[n],.55) for i,n in enumerate(tune)]
    events += [(i*2,1.25,bass if i%2==0 else bass*1.5,.28) for i in range(4)]
    write(name,events,8.0,.16)
print('Wrote 11 original loops/effects to assets/arcade (no speech).')
