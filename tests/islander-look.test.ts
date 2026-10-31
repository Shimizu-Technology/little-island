import { describe, expect, it } from 'vitest';
import { defaultLook, normalizeLook, isValidLook, hairStyles, hairColors, outfits, hats, accessories, skinTones, outfitPalettes, brows, lashes, freckles, cheeks, tops, bottoms, presentations, shoes, builds, shoeColors } from '../src/islander/look';
import { anchorsFor, wardrobe } from '../src/islander/rig/wardrobe';
import { backPose, backPoses, frontPoses, runCycleFrames } from '../src/islander/rig/poses';
describe('Islander look boundary', () => {
  it('validates every catalog field and optional palette', () => {
    expect(isValidLook(defaultLook)).toBe(true);
    for (const [key, ids] of Object.entries({ hairStyle: hairStyles, hairColor: Object.keys(hairColors), outfit: outfits, hat: hats, accessory: accessories, skinTone: Object.keys(skinTones), palette: Object.keys(outfitPalettes), brows, lashes, freckles, cheeks, top: tops, bottom: bottoms, presentation: presentations, shoes, build: builds, shoeColor: Object.keys(shoeColors) })) {
      for (const id of ids) expect(isValidLook({ ...defaultLook, [key]: id, ...(key === 'outfit' && id === 'mix' ? {top:'tee',bottom:'shorts'} : {}) }), `${key}:${id}`).toBe(true);
      for (const invalid of ['unknown', null, 3, [], {}]) expect(isValidLook({ ...defaultLook, [key]: invalid })).toBe(false);
    }
  });
  it('requires both mix pieces and leaves old looks unchanged', () => {
    expect(isValidLook({...defaultLook,outfit:'mix'})).toBe(false);
    expect(isValidLook({...defaultLook,outfit:'mix',top:'tee',bottom:'shorts'})).toBe(true);
    expect(normalizeLook({...defaultLook,outfit:'mix'})).toEqual({...defaultLook,outfit:'mix',top:'tee',bottom:'shorts'});
    expect(normalizeLook(defaultLook)).toEqual(defaultLook);
  });
  it('rejects missing, extra and inherited selections; normalizes without mutating input', () => {
    for (const value of [null, [], 'look', 0, { ...defaultLook, extra: true }, { ...defaultLook, palette: undefined }, Object.create(defaultLook), {}]) expect(isValidLook(value)).toBe(false);
    const input = Object.freeze({ ...defaultLook, hairStyle: 'curls', hat: 'bad', palette: 'bad', extra: 5 });
    expect(normalizeLook(input)).toEqual({ ...defaultLook, hairStyle: 'curls' });
    expect(normalizeLook(null)).toEqual(defaultLook);
    for (const key of Object.keys(defaultLook)) { const missing = { ...defaultLook }; delete missing[key as keyof typeof missing]; expect(isValidLook(missing)).toBe(false); }
  });
});
describe('Islander skeleton and wardrobe contracts', () => {
  it('every claimed view has every declared attachment and a known layer', () => {
    expect(new Set(wardrobe.map(i => `${i.slot}:${i.id}`)).size).toBe(hairStyles.length + outfits.length + hats.length - 1 + accessories.length - 1 + shoes.length);
    for (const item of wardrobe) for (const view of item.views) for (const pose of view === 'front' ? frontPoses : backPoses) for (const anchor of item.anchors) expect(anchorsFor(pose)[anchor].every(Number.isFinite)).toBe(true);
  });
  it('keeps every joint in bounds and each limb bone constant (back-view running legs may only foreshorten)', () => {
    for (const pose of [...frontPoses, ...backPoses]) {
      for (const p of Object.values(pose.joints)) { expect(p[0], pose.id).toBeGreaterThanOrEqual(0); expect(p[0], pose.id).toBeLessThanOrEqual(80); expect(p[1], pose.id).toBeGreaterThanOrEqual(0); expect(p[1], pose.id).toBeLessThanOrEqual(132); }
      // Back-view running legs fold in depth, so their projected bones may only shorten (never stretch).
      const folding = pose.view === 'back' && (pose.frame! < 8 || pose.frame! >= 16);
      for (const side of ['left', 'right'] as const) for (const [a,b,length] of [['Shoulder','Elbow',16],['Elbow','Hand',16],['Hip','Knee',14],['Knee','Foot',14]] as const) { const p=pose.joints[`${side}${a}`], q=pose.joints[`${side}${b}`], d=Math.hypot(p[0]-q[0],p[1]-q[1]);
        if (folding && (a === 'Hip' || a === 'Knee')) { expect(d, `${pose.id} ${side}${a}`).toBeLessThanOrEqual(length + 1e-7); expect(d, `${pose.id} ${side}${a}`).toBeGreaterThanOrEqual(length * .25); }
        else expect(d, `${pose.id} ${side}${a}`).toBeCloseTo(length,7); }
    }
  });
  it('keeps gestures inside the frame and places the writing hand on the paper', () => {
    for (const pose of [...frontPoses, ...backPoses]) for (const side of ['left', 'right'] as const) {
      const hand = pose.joints[`${side}Hand`];
      expect(hand[0], pose.id).toBeGreaterThanOrEqual(5.05);
      expect(hand[0], pose.id).toBeLessThanOrEqual(74.95);
    }
    const writing = frontPoses.find(p => p.id === 'desk-write')!.joints.rightHand;
    expect(writing[0]).toBeGreaterThan(44); expect(writing[0]).toBeLessThan(52);
    expect(writing[1]).toBeGreaterThan(84); expect(writing[1]).toBeLessThan(90);
    expect(new Set(frontPoses.filter(p => p.id.startsWith('dance-')).map(p => JSON.stringify(p.joints))).size).toBe(4);
  });
  it('keeps running legs on their own side and alternates the arm/leg swing', () => {
    for (const frame of runCycleFrames) {
      const j = backPose(frame).joints;
      for (const side of ['left', 'right'] as const) {
        const foot=j[`${side}Foot`], knee=j[`${side}Knee`];
        expect(side === 'left' ? Math.max(foot[0],knee[0]) : 80-Math.min(foot[0],knee[0])).toBeLessThan(40);
        if (foot[1] === 128) expect(foot[0]).toBe(j[`${side}Hip`][0]);
        expect(j[`${side}Knee`][0]).toBeGreaterThan(23);
        expect(j[`${side}Knee`][0]).toBeLessThan(57);
        expect(Math.hypot(j[`${side}Hand`][0]-j[`${side}Hip`][0],j[`${side}Hand`][1]-j[`${side}Hip`][1])).toBeGreaterThan(12);
      }
    }
    const a=backPose(0).joints, b=backPose(4).joints;
    expect(a.leftFoot[1]).toBeGreaterThan(a.rightFoot[1]);
    expect(a.leftHand[1]).toBeLessThan(a.rightHand[1]);
    expect(b.leftFoot[1]).toBeLessThan(b.rightFoot[1]);
    expect(b.leftHand[1]).toBeGreaterThan(b.rightHand[1]);
  });
  it('keeps every sampled running arm pair asymmetric with a hidden forward hand and a low rear hand', () => {
    for (const frame of runCycleFrames) {
      const j = backPose(frame).joints;
      const forward = j.leftHand[1] < j.rightHand[1] ? 'left' : 'right';
      const rear = forward === 'left' ? 'right' : 'left';
      expect(Math.abs(j.leftHand[1]-j.rightHand[1]), `frame ${frame}`).toBeGreaterThan(12);
      expect(j[`${forward}Hand`][0]).toBeGreaterThan(27);
      expect(j[`${forward}Hand`][0]).toBeLessThan(53);
      expect(j[`${forward}Hand`][1]-j[`${forward}Shoulder`][1]).toBeLessThan(14);
      expect(j[`${rear}Hand`][1]-j[`${rear}Shoulder`][1]).toBeGreaterThan(26);
      expect(rear === 'left' ? j.leftHand[0] : 80-j.rightHand[0]).toBeLessThan(20);
    }
  });
  it('preserves the Run frame index contract and ground contact', () => {
    expect(runCycleFrames).toEqual([0,16,1,17,2,18,3,19,4,20,5,21,6,22,7,23]);
    for (const frame of [0,1,3,4,5,7,8,10,11,12,13,15]) expect(Math.max(backPose(frame).joints.leftFoot[1],backPose(frame).joints.rightFoot[1])).toBeCloseTo(128,5);
    for (const frame of [-1,24,NaN,1.5]) expect(() => backPose(frame)).toThrow();
  });
});
