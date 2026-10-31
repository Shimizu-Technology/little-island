import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { buildFor, defaultLook, normalizeLook, outfitPalettes, outfitDefaults, skinTones, type IslanderLook } from '../look';
import { resolvePose, isLying, poseBox, type Point, type Pose, type Side, type View } from './poses';
import { anchorsFor } from './wardrobe';
import { RewardArt } from './Rewards';
import { Hair } from './Hair';
import { Face } from './Face';
import { Shoes } from './Shoes';
import { Clothes } from './Clothes';
const ink = '#493E38';
/** A closed, unoutlined fabric cap covers the top of a continuous limb. */
export function boneShape(a: Point, b: Point, r: number, end = r): string {
  const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.max(.001, Math.hypot(dx, dy)), nx = -dy / length, ny = dx / length, ux = dx / length, uy = dy / length;
  return `M${a[0] + nx * r} ${a[1] + ny * r}L${b[0] + nx * end} ${b[1] + ny * end}Q${b[0] + ux * end * 1.8} ${b[1] + uy * end * 1.8} ${b[0] - nx * end} ${b[1] - ny * end}L${a[0] - nx * r} ${a[1] - ny * r}Q${a[0] - ux * r * 1.8} ${a[1] - uy * r * 1.8} ${a[0] + nx * r} ${a[1] + ny * r}Z`;
}
/** Flat mid-thigh hem, perpendicular to the thigh; no rounded knee cap. */
export function shortsShape(a: Point, knee: Point): string {
  const b = between(a, knee, .5), length = Math.max(.001, Math.hypot(knee[0]-a[0], knee[1]-a[1]));
  const nx = -(knee[1]-a[1])/length, ny = (knee[0]-a[0])/length;
  return `M${a[0]+nx*4.3} ${a[1]+ny*4.3}L${b[0]+nx*4} ${b[1]+ny*4}L${b[0]-nx*4} ${b[1]-ny*4}L${a[0]-nx*4.3} ${a[1]-ny*4.3}Z`;
}
/** One closed contour per limb; the quadratic tangent passes smoothly around the bend. */
export function limbShape(a: Point, b: Point, c: Point, r: number, tip: number): string {
  const normal = (p: Point, q: Point): Point => { const d = Math.max(.001, Math.hypot(q[0]-p[0], q[1]-p[1])); return [-(q[1]-p[1])/d, (q[0]-p[0])/d]; };
  const n = normal(a,b), m = normal(b,c), mid = (r + tip) / 2;
  const edge = (p: Point, v: Point, w: number): string => `${p[0]+v[0]*w} ${p[1]+v[1]*w}`;
  const before = between(a,b,.78), after = between(b,c,.22);
  const calf = between(b,c,.55), shin = (sign: number) => r > 3.2 ? `Q${edge(calf,m,sign*mid*1.15)} ${edge(c,m,sign*tip)}` : `L${edge(c,m,sign*tip)}`;
  const reverseShin = r > 3.2 ? `Q${edge(calf,m,-mid*1.15)} ${edge(after,m,-mid)}` : `L${edge(after,m,-mid)}`;
  const turn: Point = [(n[0]+m[0])/2,(n[1]+m[1])/2];
  return `M${edge(a,n,r)}L${edge(before,n,mid)}Q${edge(b,turn,mid*.82)} ${edge(after,m,mid)}${shin(1)}Q${c[0]+m[1]*tip*1.5} ${c[1]-m[0]*tip*1.5} ${edge(c,m,-tip)}${reverseShin}Q${edge(b,turn,-mid*.82)} ${edge(before,n,-mid)}L${edge(a,n,-r)}Q${a[0]-n[1]*r} ${a[1]+n[0]*r} ${edge(a,n,r)}Z`;
}
const between = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export function IslanderShape({ pose, look: input = defaultLook, held, reduced = false }: { pose: Pose; look?: IslanderLook; held?: React.ReactNode; reduced?: boolean }) {
  const look = normalizeLook(input), j = pose.joints, a = anchorsFor(pose), compact = !!pose.compact, front = pose.view === 'front';
  const skin = skinTones[look.skinTone], colors = look.palette ? outfitPalettes[look.palette] : outfitDefaults[look.outfit];
  const [hx, hy] = j.head, r = compact ? 12 : 28, sy = j.leftShoulder[1], hip = j.leftHip[1];
  const top = look.outfit === 'mix' ? look.top ?? 'tee' : look.outfit;
  const bottom = look.outfit === 'mix' ? look.bottom ?? 'shorts' : look.outfit;
  const longSleeves = ['hoodie', 'hoodie-top', 'space-suit', 'pirate'].includes(top);
  const longLegs = ['trousers', 'space-suit', 'pirate', 'overalls'].includes(bottom);
  const sleeveless = ['tank', 'board-shorts-set', 'sundress', 'jersey-dress'].includes(top);
  const rearArm: Side = !front && !compact && j.rightHand[1] < j.leftHand[1] ? 'right' : 'left';
  const frontArm: Side = rearArm === 'left' ? 'right' : 'left';
  const limb = (side: Side, arm: boolean) => {
    const start = j[`${side}${arm ? 'Shoulder' : 'Hip'}`], middle = j[`${side}${arm ? 'Elbow' : 'Knee'}`], end = j[`${side}${arm ? 'Hand' : 'Foot'}`];
    const hoodie = longSleeves, radius = arm ? 3 : 3.4;
    const sleeveEnd = between(start, middle, arm ? (look.outfit === 'lab-coat' ? .9 : sleeveless ? .17 : .55) : .5);
    const cuff = between(middle,end,.83), cuffLength = Math.max(.001,Math.hypot(end[0]-middle[0],end[1]-middle[1]));
    const cuffX = -(end[1]-middle[1])/cuffLength*2.6, cuffY = (end[0]-middle[0])/cuffLength*2.6;
    const cuffLine = arm && hoodie ? `M${cuff[0]+cuffX} ${cuff[1]+cuffY}L${cuff[0]-cuffX} ${cuff[1]-cuffY}` : '';
    const stance = !arm && front ? (buildFor(look) === 'boy' ? 1 : buildFor(look) === 'girl' ? -.6 : 0) * (side === 'left' ? -1 : 1) : 0;
    return <G key={`${side}${arm}`} data-stance={stance} transform={`translate(${stance} 0) rotate(0) scale(1 1)`}>
      <Path data-limb={`${side}-${arm ? 'arm' : 'leg'}`} d={limbShape(start, middle, end, radius, arm ? 2.5 : 2.8)+cuffLine} fill={arm ? (hoodie ? colors.primary : skin) : longLegs || look.outfit === 'hoodie' ? colors.secondary : skin}/>
      {!arm && longLegs && <Path d={limbShape(start, middle, between(middle, end, .82), radius + .2, 2.9)} fill={colors.secondary} strokeWidth={0}/>}
      {(arm ? !hoodie && !sleeveless : !longLegs && look.outfit !== 'hoodie') && <Path data-garment={arm ? "sleeve" : "shorts"} d={arm ? boneShape(start, sleeveEnd, radius + .5, radius) : shortsShape(start, middle)} fill={arm ? (look.outfit === 'lab-coat' ? '#FFF2DC' : colors.primary) : colors.secondary} strokeWidth={0}/>}
      {!arm && <Shoes look={look} foot={end} back={!front} lifted={end[1]<123} compact={compact}/>}
      {arm && side === 'right' && <RewardArt look={look} pose={pose} layer="wrist"/>}
    </G>;
  };
  const hand = (side: Side) => { const [x, y] = j[`${side}Hand`], s = side === 'left' ? 1 : -1; return <Path key={side} data-mitten={side} d={`M${x - s * 1.9} ${y - 2}Q${x - s * 2.6} ${y + 2.5} ${x} ${y + 3}Q${x + s * 2.6} ${y + 3} ${x + s * 2.3} ${y}Q${x + s * 3.8} ${y - 1} ${x + s * 2.6} ${y - 3}Q${x + s * 1.9} ${y - 3} ${x + s * 1.5} ${y - 2}Z`} fill={skin} strokeWidth={1.2}/>; };
  const backpack = <G transform={`translate(${a.torso[0] - (compact ? 10 : 0)} ${a.torso[1]})`}><Rect x={compact ? -9 : -12} y={compact ? -3 : -8} width={compact ? 18 : 24} height={compact ? 13 : 28} rx={7} fill="#D2A45E"/><Rect x={compact ? -6 : -8} y={compact ? 1 : 5} width={compact ? 12 : 16} height={compact ? 7 : 11} rx={3} fill="#F4CC76"/><Path d={compact ? "M-3 -3Q0 -7 3 -3" : "M-4 -8Q0 -16 4 -8"} fill="none" strokeWidth={2}/></G>;
  return <G transform={isLying(pose) ? 'translate(6 86) rotate(-90) scale(1 1)' : 'translate(0 0) rotate(0) scale(1 1)'}>

    <G stroke={ink} strokeWidth={1.35} strokeLinejoin="round" strokeLinecap="round">
    <G data-layer="rear-accessory">{look.accessory === 'backpack' && front && backpack}</G>
    <G data-layer="rear-hair"><Hair look={look} pose={pose} rear/></G>
    <G data-layer="rear-limbs">{limb('left', false)}{limb('right', false)}{limb(rearArm, true)}{!front && !compact && hand(rearArm)}</G>
    <G data-layer="body"><Path d={`M${hx-4} ${hy+r-4}L36 ${sy+3}H44L${hx+4} ${hy+r-4}Z M29 ${sy}Q40 ${sy-5} 51 ${sy}L50 ${hip+2}H30Z ${['long-straight','long-wavy','bob','braids'].includes(look.hairStyle) ? '' : `M${hx-r+1} ${hy+7}q-5-2-4 2q0 4 4 4M${hx+r-1} ${hy+7}q5-2 4 2q0 4-4 4`}`} fill={skin}/>
      {!compact && <><Path data-head="soft-square" d={`M${hx-r} ${hy-9}Q${hx-r} ${hy-28} ${hx} ${hy-28}Q${hx+r} ${hy-28} ${hx+r} ${hy-9}L${hx+r} ${hy+11}Q${hx+r} ${hy+28} ${hx} ${hy+28}Q${hx-r} ${hy+28} ${hx-r} ${hy+11}Z`} fill={skin}/><Path d={`M${hx+24} ${hy-7}V${hy+10}Q${hx+24} ${hy+24} ${hx+4} ${hy+26}Q${hx+28} ${hy+29} ${hx+28} ${hy+11}V${hy-7}Z`} fill="#7E5142" fillOpacity={.10} strokeWidth={0}/></>}</G>
    <G data-layer="clothing"><Clothes look={look} pose={pose} colors={colors}/>{compact && look.accessory === 'backpack' && backpack}</G>
    <G data-layer="front-limbs">{limb(frontArm, true)}</G>
    <G data-layer="held" transform={`translate(${j.rightHand[0]-12} ${j.rightHand[1]-12})`}>{held}</G>
    <G data-layer="hands">{front || compact ? <>{hand('left')}{hand('right')}</> : hand(frontArm)}</G>
    <RewardArt look={look} pose={pose} layer="neckwear"/><G data-layer="front-hair"><Hair look={look} pose={pose}/></G>
    <RewardArt look={look} pose={pose} layer="hair"/><G data-layer="face"><Face look={look} pose={pose}/></G>
    <G data-layer="hat" transform={`translate(${a.headTop[0]} ${a.headTop[1]}) scale(${compact ? 1 : 1.12} 1)`}>
      {look.hat === 'sunhat' && <G fill="#F4CC76"><Path d={compact ? 'M-11 3L-10 -2Q0 -5 10 -2L11 3Z' : 'M-19 7L-16 -2Q0 -6 16 -2L19 7Z'}/><Path d={compact ? 'M-15 4Q0 0 15 4Q0 8-15 4Z' : 'M-28 9Q-27 4-19 5H19Q27 4 28 9Q0 18-28 9Z'}/><Path d={compact ? 'M-10 1H10' : 'M-12 2Q0 5 12 2'} stroke="#D47F66" strokeWidth={3}/></G>}
      {look.hat === 'cap' && <G fill={colors.secondary}><Path d={compact ? 'M-12 4Q-11-5 0-5Q11-5 12 4Z' : 'M-23 10Q-24-5 0-5Q23-4 23 10Z'}/><Path d={front ? 'M0 5Q20 1 22 8Q12 12 0 8Z' : 'M-8 5H8V10H-8Z'} fill={colors.primary}/></G>}
      {look.hat === 'flower-crown' && <G><Path d="M-16 6Q0-1 16 6" stroke="#639477" strokeWidth={3} fill="none"/>{[-12, 0, 12].map((x, i) => <G key={x} transform={`translate(${x} ${i === 1 ? 1 : 5})`} strokeWidth={.6}>{[0, 72, 144, 216, 288].map(angle => <Ellipse key={angle} cx={0} cy={-2.3} rx={1.9} ry={2.8} transform={`rotate(${angle})`} fill="#FFF0D1"/>)}<Circle r={1.6} fill="#E9AF4A"/></G>)}</G>}
    </G>
    <RewardArt look={look} pose={pose} layer="hat"/><G data-layer="foreground-accessory"><RewardArt look={look} pose={pose} layer="accessory"/>{look.accessory === 'backpack' && (!front ? !compact && backpack : <G fill="none" stroke="#D2A45E" strokeWidth={3}><Path d={`M28 ${sy}L31 ${hip - 9}M52 ${sy}L49 ${hip - 9}`}/></G>)}
      {look.accessory === 'glasses' && front && <G fill="#E7F5ED" fillOpacity={.22} strokeWidth={1.3}><Rect x={hx - 13} y={hy + 3} width={11} height={9} rx={3}/><Rect x={hx + 2} y={hy + 3} width={11} height={9} rx={3}/><Path d={`M${hx - 2} ${hy + 6}h4M${hx - 16} ${hy + 5}h3M${hx + 13} ${hy + 5}h3`} fill="none"/></G>}
      {look.accessory === 'glasses' && !front && <Path d={`M${hx - r} ${hy + 1}l-2-2M${hx + r} ${hy + 1}l2-2`} fill="none"/>}
    </G>
  </G>{pose.id === 'lie-asleep' && !reduced && <SvgText x={38} y={12} transform="rotate(90 38 12)" fontSize={10} fill={ink}>z</SvgText>}</G>;
}
/** Static SVG; callers pre-render frames and swap opacity. Never runs a timer or worklet. */
export const Islander = memo(function Islander({ view = 'front', pose = view === 'back' ? 0 : 'idle', look = defaultLook, size = 120, held, reduced = false }: { view?: View; pose?: string | number | Pose; look?: IslanderLook; size?: number; held?: React.ReactNode; reduced?: boolean }) {
  const resolved = resolvePose(view, pose), box = poseBox(resolved), scale = size / 132;
  return <Svg key={`${view}:${resolved.id}`} width={box.width * scale} height={box.height * scale} viewBox={`0 0 ${box.width} ${box.height}`} accessible={false}><IslanderShape pose={resolved} look={look} held={held} reduced={reduced}/></Svg>;
});
/** Separate foreground prop: does not distort or hide the character's skeleton. */
export const IslanderDesk = memo(function IslanderDesk({ size = 120 }: { size?: number }) {
  return <Svg width={size * 80 / 132} height={size} viewBox="0 0 80 132" accessible={false}><G stroke={ink} strokeWidth={1.35} strokeLinejoin="round"><Path d="M13 90H67L72 97H8Z" fill="#D2A45E"/><Path d="M15 97V130H20V97M60 97V130H65V97" fill="#B98458"/><Path d="M29 89L44 87L51 92L36 94Z" fill="#FFF7DE"/><Path d="M48 89L53 81" stroke="#364D79" strokeWidth={2}/></G></Svg>;
});
