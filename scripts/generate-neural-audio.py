"""Build-time neural speech. Models and Python environment stay outside the app.

Kokoro-82M v1.0 (Apache-2.0), kokoro-onnx (MIT). No child data or network
playback. Complete warm/calm banks must be published before a release.
Usage: <venv>/bin/python scripts/generate-neural-audio.py --model-dir <path>
"""
from pathlib import Path
import argparse, concurrent.futures, hashlib, json, os, re, subprocess, tempfile, time

ROOT = Path(__file__).resolve().parent.parent
VOICES = {'warm': 'af_heart', 'calm': 'af_bella'}
VOICE_FILE_SHA256 = "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"
MODEL = None

def initialize(model_dir, data_dir):
    global MODEL
    import onnxruntime as rt
    from kokoro_onnx import Kokoro
    from kokoro_onnx.config import EspeakConfig
    options = rt.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    session = rt.InferenceSession(str(Path(model_dir)/'kokoro-v1.0.onnx'), options, providers=['CPUExecutionProvider'])
    MODEL = Kokoro.from_session(session, str(Path(model_dir)/'voices-v1.0.bin'), espeak_config=EspeakConfig(data_path=data_dir))

def legacy_spoken(text):
    # Only for verifying cache migration from the first build13 generation.
    for old,new in [(' × ', ' times '), (' + ', ' plus '), (' − ', ' minus '), (' = ', ' equals '), ('→', ' right '), ('←', ' left '), ('↓', ' down '), ('↑', ' up '), ('|', ' '), ('CHamoru', 'Chamorro')]:
        text = text.replace(old,new)
    return re.sub(r'(?<=[=+−×\d ])\?(?=[ =+−×\d])', 'blank', text)

def spoken(text):
    # Resolve equation blanks before replacing operators. Sentence question
    # marks stay punctuation; a trailing equation blank must be spoken too.
    text=re.sub(r'\?(?=\s*[=+−×-])|(?<=[=+−×-])\s*\?', ' blank ', text)
    text=re.sub(r'[ \t]+', ' ', text)
    for old,new in [(' × ', ' times '), (' + ', ' plus '), (' − ', ' minus '), (' - ', ' minus '), (' = ', ' equals '), ('→', ' right '), ('←', ' left '), ('↓', ' down '), ('↑', ' up '), ('|', ' '), ('CHamoru', 'Chamorro')]:
        text=text.replace(old,new)
    return text.strip()

def input_digest(text,voice,model_hash,legacy=False):
    parts=[text,VOICES[voice],0.95,model_hash,'loudnorm-20-3-7-v1']
    if not legacy: parts.append(spoken(text))
    return hashlib.sha256(json.dumps(parts,ensure_ascii=False).encode()).hexdigest()

def generate(item):
    import soundfile as sf
    import numpy as np
    voice,key,text,digest = item
    out = ROOT/'assets/audio'/('' if voice == 'warm' else 'calm')
    out.mkdir(parents=True, exist_ok=True)
    target = out/f'{key}.m4a'
    samples, rate = MODEL.create(spoken(text), voice=VOICES[voice], speed=0.95, lang='en-us')
    if len(samples) < rate * 0.08 or not np.isfinite(samples).all():
        raise RuntimeError(f'Invalid speech {key}')
    with tempfile.TemporaryDirectory(prefix='li-neural-') as temp:
        wav = Path(temp)/'voice.wav'; encoded = Path(temp)/'voice.m4a'
        sf.write(wav, samples, rate)
        # Loudness normalization and a true-peak ceiling avoid loud surprises.
        subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-20:TP=-3:LRA=7','-ar','24000','-ac','1','-c:a','aac','-b:a','48k',str(encoded)], check=True,timeout=45)
        encoded.replace(target)
    return voice,key,{'input':digest,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'seconds':round(len(samples)/rate,3)}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', required=True)
    parser.add_argument('--data-dir', required=True, help='Short physical path to espeak-ng-data (the library has a path-length limit)')
    parser.add_argument('--workers', type=int,default=2)
    parser.add_argument('--limit', type=int)
    args = parser.parse_args()
    speech = json.loads(subprocess.check_output([os.sys.executable,str(ROOT/'scripts/generate-audio.py'),'--manifest'],text=True,timeout=30))
    receipt = Path(args.model_dir)/'generated.json'
    records = json.loads(receipt.read_text()) if receipt.exists() else {}
    voice_hash=hashlib.sha256((Path(args.model_dir)/'voices-v1.0.bin').read_bytes()).hexdigest()
    if voice_hash != VOICE_FILE_SHA256: raise RuntimeError('Voice data differs from the pinned v1.0 bank')
    model_hash = hashlib.sha256((Path(args.model_dir)/'kokoro-v1.0.onnx').read_bytes()).hexdigest()
    items=[]
    for voice in VOICES:
        for key,text in sorted(speech.items()):
            digest=input_digest(text,voice,model_hash)
            target=ROOT/'assets/audio'/('' if voice=='warm' else 'calm')/f'{key}.m4a'
            old=records.get(voice,{}).get(key,{})
            file_matches=target.exists() and old.get('sha256')==hashlib.sha256(target.read_bytes()).hexdigest()
            if file_matches and old.get('input')==input_digest(text,voice,model_hash,legacy=True) and legacy_spoken(text)==spoken(text):
                # Identical inference input: migrate the receipt, never assume
                # changed mathematical speech can reuse an old clip.
                old['input']=digest
            if file_matches and old.get('input')==digest:continue
            items.append((voice,key,text,digest))
    if args.limit: items=items[:args.limit]
    print(f'PID {os.getpid()}: {len(items)} pending clips; {len(speech)} keys per voice',flush=True)
    started=time.time()
    pool = concurrent.futures.ProcessPoolExecutor(max_workers=max(1,min(args.workers,3)),initializer=initialize,initargs=(args.model_dir,args.data_dir))
    try:
        # Keep the queue bounded and fail rather than hang on native inference.
        pending=[]; iterator=iter(items)
        for item in iterator:
            pending.append(pool.submit(generate,item))
            if len(pending)>=max(1,min(args.workers,3))*2: break
        index=0
        while pending:
            voice,key,entry=pending.pop(0).result(timeout=120)
            index+=1
            item=next(iterator,None)
            if item is not None: pending.append(pool.submit(generate,item))
            records.setdefault(voice,{})[key]=entry
            if index%10==0 or index==len(items):
                tmp=receipt.with_suffix('.tmp');tmp.write_text(json.dumps(records,sort_keys=True));tmp.replace(receipt)
            if index%50==0:print(f'{index}/{len(items)} clips · {round(time.time()-started)} seconds',flush=True)
    except BaseException:
        # Python 3.12 has no public terminate_workers; only this executor's
        # children are retained and stopped, never a shared process-name kill.
        owned=list((pool._processes or {}).values())
        pool.shutdown(wait=False,cancel_futures=True)
        for process in owned:
            if process.is_alive(): process.terminate()
        for process in owned:
            process.join(timeout=5)
            if process.is_alive(): process.kill(); process.join(timeout=5)
        raise
    else:
        pool.shutdown(wait=True)
    tmp=receipt.with_suffix('.tmp');tmp.write_text(json.dumps(records,sort_keys=True));tmp.replace(receipt)
    if args.limit: return
    latest=json.loads(subprocess.check_output([os.sys.executable,str(ROOT/'scripts/generate-audio.py'),'--manifest'],text=True,timeout=30))
    if latest != speech: raise RuntimeError('Speech manifest changed during generation; rerun before publication')
    if hashlib.sha256((Path(args.model_dir)/'kokoro-v1.0.onnx').read_bytes()).hexdigest()!=model_hash or hashlib.sha256((Path(args.model_dir)/'voices-v1.0.bin').read_bytes()).hexdigest()!=voice_hash:
        raise RuntimeError('Inference files changed during generation; refusing publication')
    # A map is published only when every expected clip has the matching input hash.
    for voice in VOICES:
        for key,text in speech.items():
            target=ROOT/'assets/audio'/('' if voice=='warm' else 'calm')/f'{key}.m4a'
            expected=input_digest(text,voice,model_hash)
            record=records.get(voice,{}).get(key,{})
            if record.get('input')!=expected or not target.exists() or record.get('sha256')!=hashlib.sha256(target.read_bytes()).hexdigest():
                raise RuntimeError(f'Incomplete or stale {voice}/{key}')
    lines=['// Generated offline Kokoro voice banks; see docs/LEARNING_GROWTH.md.','export const voiceSources: Record<"warm" | "calm", Record<string, number>> = {']
    for voice in VOICES:
        lines.append(f'  {voice}: {{')
        for key in sorted(speech):
            target=f'../../assets/audio/{"" if voice=="warm" else "calm/"}{key}.m4a'
            lines.append(f'    {json.dumps(key)}: require({json.dumps(target)}),')
        lines.append('  },')
    lines.append('};\n')
    (ROOT/'src/content/neuralAudio.ts').write_text('\n'.join(lines))
    evidence={'engine':'Kokoro-82M v1.0','modelLicense':'Apache-2.0','runtime':'kokoro-onnx 0.6.1 / MIT','modelSHA256':model_hash,'voiceDataSHA256':voice_hash,'scriptManifestSHA256':hashlib.sha256(json.dumps(speech,ensure_ascii=False,sort_keys=True).encode()).hexdigest(),'voices':VOICES,'keysPerVoice':len(speech),'secondsByVoice':{v:round(sum(records[v][k]['seconds'] for k in speech),2) for v in VOICES},'networkPlayback':False,'normalization':'-20 LUFS, -3 dBTP, LRA7; 24kHz mono AAC48k','listeningAcceptance':'Operator assessment on family hardware remains separate.'}
    # The private repo keeps a dated evidence copy; public exports have no docs/ and skip it.
    if (ROOT/'docs').is_dir():
        (ROOT/'docs/evidence').mkdir(exist_ok=True)
        (ROOT/'docs/evidence/neural-audio.json').write_text(json.dumps(evidence,indent=2)+'\n')
    (ROOT/'tests/fixtures').mkdir(parents=True,exist_ok=True)
    # docs/ is not exported publicly, so the test fixture and the public export receipt carry the same facts.
    (ROOT/'tests/fixtures/neural-audio.json').write_text(json.dumps(evidence,indent=2)+'\n')
    public=ROOT/'scripts/public-audio-receipt.json'
    previous=json.loads(public.read_text()) if public.exists() else {'sha256':{}}
    hashes={k:v for k,v in previous.get('sha256',{}).items() if k.endswith('.wav')}
    for voice in VOICES:
        for key in speech:
            rel=f'audio/{"" if voice=="warm" else "calm/"}{key}.m4a'
            hashes[rel]=hashlib.sha256((ROOT/'assets'/rel).read_bytes()).hexdigest()
    public.write_text(json.dumps({'provenance':'Kokoro-82M v1.0; neural hashes verified against local generation receipt. WAV files are original synthesized tones/loops.','sha256':dict(sorted(hashes.items())),'speechReceipt':evidence},indent=2)+'\n')
    print('Published both complete offline voice maps',flush=True)

if __name__=='__main__':main()
