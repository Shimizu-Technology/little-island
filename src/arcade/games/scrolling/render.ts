import { harborSceneryPose } from '../lagoon-run/scenery';
import { CANOE_DEPTH, isCanoe, visualRunHeight } from "../lagoon-run/geometry";
import { HAZARDS } from "../lagoon-run/course";
import { HIDDEN_POSE, rankPainterPoses, type SpritePose } from "../../poses";
import { runSpeed, runnerHeight, shellHeight, obstacleLane, runLearning, type RunState } from "../lagoon-run/engine";
import { RAMP_DEPTH, RAMP_SECTIONS, surfaceProfile, surfaceSpan } from "../lagoon-run/surface";
import { CAMERA_SLOT, TRACK_WIDTH, projectTrack, trackSprite } from "../lagoon-run/camera";
import { runnerFrame, RUN_POSES, RUN_EXTRA } from "./character";
import { groundTexturePose, SCENE_COUNT, SCENE_START, TEXTURE_START, TEXTURE_COUNT } from "./environmentPoses";
export const INCLINE_START = 179, INCLINE_STRIDE = RAMP_SECTIONS * 4, POWER_AURA = INCLINE_START + 5 * INCLINE_STRIDE, CANOE_START = RUN_EXTRA + 8, RUN_SLOTS = CANOE_START + 15 * 4 + 1;
export function runPoses(s: RunState, reduced = false): SpritePose[] {
  "worklet";
  const p:SpritePose[]=Array(RUN_SLOTS).fill(HIDDEN_POSE),learn=runLearning(s),contact=projectTrack(s.poseLane,1),frame=runnerFrame(s,reduced),lift=visualRunHeight(runnerHeight(s))*85;
  // Root is bottom-centre; poses have their own authored contact/compression, never free limbs.
  p[0]={identity:s.lives.hit,x:contact.x-40,y:contact.y-130-lift,angle:reduced||s.duck>0||s.kite>0?0:(s.lane-s.poseLane)*.14};
  for(let i=0;i<RUN_POSES;i++)p[i<16?80+i:RUN_EXTRA+i-16]=i===frame?{x:0,y:0,snap:true}:HIDDEN_POSE;
  p[55]=reduced||s.landing<=0?HIDDEN_POSE:{x:contact.x-40,y:contact.y-15-lift,scale:1+(1-s.landing/.13)*.5,opacity:s.landing/.13};
  p[50]={x:contact.x-35,y:contact.y-7,scale:1-Math.min(2.7,runnerHeight(s))*.18,opacity:.8};
  s.rows.forEach((row,i)=>{
    const visible=!learn&&row.z> -1.2;
    // Each obstacle uses its own kind for size, contact height and spin (a row can mix kinds).
    const hazardPose = (lane: number, kind: typeof row.kind, actor: number) => { "worklet";
      if(lane<0 || row.z >= (isCanoe(kind)?1.18+CANOE_DEPTH:1.18))return HIDDEN_POSE;
      if(isCanoe(kind)) {
        for(let j=0;j<4;j++) {
          const a=projectTrack(lane+(j===0||j===3?-.30:.30),row.z-(j<2?0:CANOE_DEPTH));
          p[CANOE_START+actor*4+j]={identity:row.serial,x:a.x,y:a.y,scale:a.scale};
        }
        return {identity:row.serial,x:0,y:0,painterDepth:projectTrack(1,row.z).scale,painterKey:row.serial*7+actor%3,opacity:1};
      }
      const a=trackSprite(lane,row.z,HAZARDS[kind]==="duck"?112:72,HAZARDS[kind]==="jump"?72:129.6),height=surfaceProfile(row,row.surface==="gap"?RAMP_DEPTH:0,lane); return {identity:row.serial,...a,painterDepth:a.scale,painterKey:row.serial*7+actor%3,opacity:a.opacity===0?0:.4+.6*Math.max(0,Math.min(1,(row.z+1.2)/2.2)),y:a.y-height*85*a.scale,angle:kind === "coconut" && !reduced ? s.time*3 : 0}; };
    p[1+i*2]=visible?hazardPose(obstacleLane(row,s.time),row.kind,i*3):HIDDEN_POSE;
    p[2+i*2]=visible&&row.second>=0?hazardPose(row.second,row.secondKind,i*3+1):HIDDEN_POSE;
    p[75+i]=visible&&row.third?hazardPose(row.shellLane,row.kind,i*3+2):HIDDEN_POSE;
    for(let c=0;c<3;c++){
      const z=row.z+c*.07,t=row.bursts[c]/.26;
      const a=trackSprite(row.shellLane,z,30,30),h=s.kite>0?2.7:shellHeight(row,c);
      const pull=s.magnet>0?Math.max(0,Math.min(1,(z-.65)/.35)):0;
      if(pull>0){a.x+=(contact.x-15-a.x)*pull;a.y+=(contact.y-70-a.y)*pull;}
      p[11+i*3+c]=!learn&&!(row.shellTaken&(1<<c))&&z> -1.2&&z<1.18?{identity:row.serial,...a,painterDepth:a.scale,painterKey:row.serial*7+3+c,y:a.y-visualRunHeight(h)*85*a.scale}:HIDDEN_POSE;
      if(learn&&!row.passed&&row.z> -1.2&&row.z<1.08)p[60+i*3+c]={identity:row.phase,...trackSprite(c,row.z,64,64)};
      if(!learn&&t>0){const a=projectTrack(row.shellLane,1);p[132+i*3+c]={identity:`${row.phase}-${c}`,x:a.x-24,y:a.y-45-(1-t)*28,scale:reduced?1:1+(1-t)*.55,opacity:t};}
    }
    const power=trackSprite(row.shellLane,row.z+.23,44,44);
    p[167+i]=!learn&&row.power!=="none"&&!row.powerDone?{identity:row.serial,...power,painterDepth:power.scale,painterKey:row.serial*7+6,y:power.y-(30+surfaceProfile(row,-.23)*85)*power.scale}:HIDDEN_POSE;
    if(!learn&&row.surface!=="sand"&&row.z> -1.2&&row.z-row.length<1.18){
      for(let segment=-1;segment<(row.surface==="ramp"?RAMP_SECTIONS:0);segment++){
        const span=surfaceSpan(row,segment),start=segment>=0?INCLINE_START+i*INCLINE_STRIDE+segment*4:147+i*4;
        for(let j=0;j<4;j++){
          const behind=span[j<2?0:1],lane=row.shellLane+(j===0||j===3?-.43:.43),a=projectTrack(lane,row.z-behind);
          const height=surfaceProfile(row,behind)*85*a.scale;
          p[start+j]={identity:row.serial,x:a.x,y:a.y-height,scale:height,opacity:1};
        }
      }
    }
  });
  p[POWER_AURA]={x:contact.x-56,y:contact.y-144-lift,opacity:s.magnet>0?.65:0,scale:reduced?1:1+Math.sin(s.time*5)*.025};
  p[POWER_AURA+1]={x:contact.x-43,y:contact.y-20-lift,opacity:s.sandals>0?1:0};
  p[172]={x:contact.x-36,y:contact.y-200-lift,opacity:s.kite>0?1:0};
  p[173]={x:contact.x-48,y:contact.y-134-lift,opacity:s.shield||s.protection>0?.7:0};
  for(let i=0;i<14;i++){const distance=s.travel+Math.floor(i/2)*.17,z=distance%1.18;p[35+i]={identity:Math.floor(distance/1.18),...trackSprite(i%2?1.5:.5,z,4,36)};}
  for(let i=0;i<SCENE_COUNT;i++)p[SCENE_START+i]=harborSceneryPose(s.travel,i);
  for(let i=0;i<TEXTURE_COUNT;i++)p[TEXTURE_START+i]=groundTexturePose(s.travel,i);
  const lean = reduced ? 0 : s.lane-s.poseLane;
  const shake = reduced ? 0 : Math.max(0,s.cooldown/.3);
  // Camera is always visible. Its scale field carries speed-line intensity, not zoom.
  p[CAMERA_SLOT]={x:-(contact.x-195)*.7-lean*5+Math.sin(s.time*95)*shake*5,y:reduced?0:Math.sin(s.travel*32)*1.1+Math.cos(s.time*83)*shake*3,angle:lean*.018,opacity:1,scale:reduced?0:Math.max(0,Math.min(.65,(runSpeed(s)-.42)*2.5))};
  const next=s.rows.filter(r=>!r.passed).sort((a,b)=>b.z-a.z)[0];
  const move=next?.action==="idle"?4:next?.action==="jump"?1:2;
  p[57]={x:260,y:78,opacity:!learn&&next&&next.z>.35&&(next.action!=="idle"||s.lane!==next.shellLane)&&!(s.learned&move)?1:0};
  const f=s.feedback/.45,scored=s.lastGain>0;
  p[56]={x:Math.min(TRACK_WIDTH-88,contact.x+42),y:396-(1-f)*25,opacity:scored&&s.cue!=="shell"?f:0};
  if(s.cue==="bump"&&!reduced)for(let i=0;i<6;i++){const a=i*Math.PI/3;p[26+i]={x:contact.x+Math.cos(a)*(1-f)*50,y:contact.y-60+Math.sin(a)*(1-f)*50,opacity:f};}
  // Inactive slots retain one canonical object and never send hidden native transforms.
  for(let i=0;i<p.length;i++)if(p[i].opacity===0)p[i]=HIDDEN_POSE;
  return rankPainterPoses(p);
}
