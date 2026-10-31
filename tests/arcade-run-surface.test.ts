import { describe, expect, it } from 'vitest';
import { projectTrack } from '../src/arcade/games/lagoon-run/camera';
import { createRun, rowSafe, runStep, shellHeight, surfaceHeight, type RunState } from '../src/arcade/games/lagoon-run/engine';
import { RAMP_SECTIONS } from '../src/arcade/games/lagoon-run/surface';
import { runLevels } from '../src/arcade/games/scrolling/content';
import { INCLINE_START, INCLINE_STRIDE, runPoses } from '../src/arcade/games/scrolling/render';

const idle = { type: 'idle' } as const;
function rampState(z: number, length = .64): RunState {
  const s = createRun(runLevels[1], 1);
  return { ...s, rows: [{ ...s.rows[0], surface: 'ramp', z, length, lane: 0, second: 2, third: false, shellLane: 1, action: 'idle' }, ...s.rows.slice(1)] };
}
/** Intersect the actual projected quad edges with the contact-depth cross section.
 * Perspective scale is recovered from the drawn width, independently of support height. */
function drawnContact(s: RunState) {
  const section = Math.min(RAMP_SECTIONS-1,Math.floor((s.rows[0].z-.82)/.18*RAMP_SECTIONS));
  const p = runPoses(s), index = s.rows[0].z < 1 ? INCLINE_START+section*4 : 147;
  const [a,b,c,d] = p.slice(index, index + 4);
  const fullWidth = projectTrack(1.43, 1).x - projectTrack(.57, 1).x;
  const front = (b.x - a.x) / fullWidth, back = (c.x - d.x) / fullWidth;
  const t = (1 - front) / (back - front);
  return (a.y+b.y)/2 + ((c.y+d.y-a.y-b.y)/2) * t;
}

describe('Lagoon Run shared ramp surface', () => {
  it('keeps support and planted feet on the incline while the shadow stays on sand', () => {
    for (const length of [.25, .64, .8]) for (const z of [.82, .835, .86, .9, .94, .98, 1, 1.08, 1.2, 1+length, 1+length+.01]) {
      const s = rampState(z, length), height = surfaceHeight(s.rows[0]);
      s.elevation = height;
      const p = runPoses(s), y = drawnContact(s);
      expect(Math.abs(projectTrack(1,1).y-height*85-y), `support z=${z}`).toBeLessThan(2);
      expect(Math.abs(p[0].y+130-y), `feet z=${z}`).toBeLessThan(2);
      expect(p[50].y+7, `ground shadow z=${z}`).toBeCloseTo(projectTrack(1,1).y);
    }
  });
  it('follows the drawn ramp through real 60 Hz physics steps and drops after the drawn tail', () => {
    let s = rampState(.80);
    for (let i=0;i<220;i++) {
      s = runStep(s,idle,1/60);
      if (s.rows[0].z >= .82 && s.rows[0].z <= 1.64+.015) expect(Math.abs(runPoses(s)[0].y+130-drawnContact(s))).toBeLessThan(2);
    }
    expect(s.elevation).toBe(0);
  });
  it('places ramp shells on the incline and top, and collects them at those same heights', () => {
    for (let c=0;c<3;c++) {
      const s = rampState(1-c*.07), row=s.rows[0], height=surfaceHeight(row);
      s.elevation=height;
      const p=runPoses(s)[11+c], point=projectTrack(1,row.z+c*.07);
      expect(shellHeight(row,c)).toBeCloseTo(height);
      // trackSprite is centre-scaled: recover its visible bottom contact.
      expect(p.y+15+15*(p.scale??1)).toBeCloseTo(point.y-height*85*point.scale);
      const next=runStep(s,idle,1/60);
      expect(next.rows[0].shellTaken & (1<<c)).toBe(1<<c);
    }
    expect(shellHeight(rampState(1).rows[0],0)).toBe(.85);
  });
  it('uses top height for ramp hazards, the approach height for powers, and ground contact for airborne shadows', () => {
    const s=rampState(1), row=s.rows[0];
    const ground=runPoses(s)[1],groundPoint=projectTrack(0,1);
    expect(ground.y+64.8+64.8*(ground.scale??1)).toBeCloseTo(groundPoint.y);
    expect(rowSafe({...s,poseLane:0,lane:0},row)).toBe(false);
    row.power='shield'; row.kind='log'; row.lane=1; row.second=-1; s.elevation=.85;
    const p=runPoses(s), hazard=projectTrack(1,1);
    expect(p[1].y+36+36*(p[1].scale??1)).toBeCloseTo(hazard.y-.85*85);
    expect(rowSafe(s,row)).toBe(false);
    expect(rowSafe({...s,elevation:1.4},row)).toBe(true);
    // The pickup has already passed the camera; hidden slots are canonical.
    expect(p[167].opacity).toBe(0);
    const approaching={...s,rows:s.rows.map((r,i)=>i?r:{...r,z:.7})};
    const pickup=runPoses(approaching)[167],power=projectTrack(1,.93);
    expect(pickup.y+22+22*(pickup.scale??1)).toBeCloseTo(power.y-30*power.scale);
    const falling={...s,rows:s.rows.map(r=>({...r,surface:'sand' as const})),elevation:.85};
    expect(runPoses(falling)[50].y+7).toBeCloseTo(projectTrack(1,1).y);
  });
  it('joins the incline and deck at identical projected points without overwriting other pose slots', () => {
    const s=rampState(.93),p=runPoses(s);
    expect(p[INCLINE_START+INCLINE_STRIDE-2]).toEqual(p[148]);
    expect(p[INCLINE_START+INCLINE_STRIDE-1]).toEqual(p[147]);
    expect(p[INCLINE_START+INCLINE_STRIDE].opacity).toBe(0);
    expect(p[172].opacity).toBe(0);
    expect(p[173].opacity).toBe(0);
  });
});
