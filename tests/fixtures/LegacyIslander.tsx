import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { defaultLook, hairColors, normalizeLook, outfitPalettes, skinTones, type IslanderLook } from '../../src/islander/look';
import { resolvePose, type Point, type Pose, type Side, type View } from '../../src/islander/rig/poses';
import { anchorsFor } from '../../src/islander/rig/wardrobe';
import { RewardArt } from '../../src/islander/rig/Rewards';
const ink = '#493946';
/** A closed, unoutlined fabric cap covers the top of a continuous limb. */
export function boneShape(a: Point, b: Point, r: number, end = r): string {
  const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.max(.001, Math.hypot(dx, dy)), nx = -dy / length, ny = dx / length, ux = dx / length, uy = dy / length;
  return `M${a[0] + nx * r} ${a[1] + ny * r}L${b[0] + nx * end} ${b[1] + ny * end}Q${b[0] + ux * end * 1.8} ${b[1] + uy * end * 1.8} ${b[0] - nx * end} ${b[1] - ny * end}L${a[0] - nx * r} ${a[1] - ny * r}Q${a[0] - ux * r * 1.8} ${a[1] - uy * r * 1.8} ${a[0] + nx * r} ${a[1] + ny * r}Z`;
}
/** Flat mid-thigh hem, perpendicular to the thigh; no rounded knee cap. */
export function shortsShape(a: Point, knee: Point): string {
  const b = between(a, knee, .5), length = Math.max(.001, Math.hypot(knee[0]-a[0], knee[1]-a[1]));
  const nx = -(knee[1]-a[1])/length, ny = (knee[0]-a[0])/length;
  return `M${a[0]+nx*6.7} ${a[1]+ny*6.7}L${b[0]+nx*6.2} ${b[1]+ny*6.2}L${b[0]-nx*6.2} ${b[1]-ny*6.2}L${a[0]-nx*6.7} ${a[1]-ny*6.7}Z`;
}
/** One closed contour per limb; the quadratic tangent passes smoothly around the bend. */
export function limbShape(a: Point, b: Point, c: Point, r: number, tip: number): string {
  const normal = (p: Point, q: Point): Point => { const d = Math.max(.001, Math.hypot(q[0]-p[0], q[1]-p[1])); return [-(q[1]-p[1])/d, (q[0]-p[0])/d]; };
  const n = normal(a,b), m = normal(b,c), mid = (r + tip) / 2;
  const edge = (p: Point, v: Point, w: number): string => `${p[0]+v[0]*w} ${p[1]+v[1]*w}`;
  const before = between(a,b,.78), after = between(b,c,.22);
  const turn: Point = [(n[0]+m[0])/2,(n[1]+m[1])/2];
  return `M${edge(a,n,r)}L${edge(before,n,mid)}Q${edge(b,turn,mid*1.3)} ${edge(after,m,mid)}L${edge(c,m,tip)}Q${c[0]+m[1]*tip*1.5} ${c[1]-m[0]*tip*1.5} ${edge(c,m,-tip)}L${edge(after,m,-mid)}Q${edge(b,turn,-mid*1.3)} ${edge(before,n,-mid)}L${edge(a,n,-r)}Q${a[0]-n[1]*r} ${a[1]+n[0]*r} ${edge(a,n,r)}Z`;
}
const between = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export function IslanderShape({ pose, look: input = defaultLook }: { pose: Pose; look?: IslanderLook }) {
  const look = normalizeLook(input), j = pose.joints, a = anchorsFor(pose), compact = !!pose.compact, front = pose.view === 'front';
  const skin = skinTones[look.skinTone], hair = hairColors[look.hairColor], colors = outfitPalettes[look.palette ?? (look.outfit === 'hoodie' ? 'twilight' : look.outfit === 'explorer' ? 'lagoon' : 'coral')];
  const [hx, hy] = j.head, r = compact ? 12 : 23, sy = j.leftShoulder[1], hip = j.leftHip[1], hasHat = look.hat !== 'none' && look.hat !== 'flower-crown';
  const rearArm: Side = !front && !compact && j.rightHand[1] < j.leftHand[1] ? 'right' : 'left';
  const frontArm: Side = rearArm === 'left' ? 'right' : 'left';
  const limb = (side: Side, arm: boolean) => {
    const start = j[`${side}${arm ? 'Shoulder' : 'Hip'}`], middle = j[`${side}${arm ? 'Elbow' : 'Knee'}`], end = j[`${side}${arm ? 'Hand' : 'Foot'}`];
    const hoodie = look.outfit === 'hoodie', dress = look.outfit === 'sundress', radius = arm ? 5.5 : 6.2;
    const sleeveEnd = between(start, middle, arm ? (look.outfit === 'lab-coat' ? .9 : .55) : .5);
    return <G key={`${side}${arm}`}>
      <Path data-limb={`${side}-${arm ? 'arm' : 'leg'}`} d={limbShape(start, middle, end, radius, arm ? 3.9 : 4.5)} fill={hoodie ? (arm ? colors.primary : colors.secondary) : skin}/>
      {!hoodie && (!arm || !dress) && <Path data-garment={arm ? "sleeve" : "shorts"} d={arm ? boneShape(start, sleeveEnd, radius + .5, radius) : shortsShape(start, middle)} fill={arm ? (look.outfit === 'lab-coat' ? '#FFF2DC' : colors.primary) : colors.secondary} strokeWidth={0}/>}
      {!arm && <Path data-sole={!front && end[1] < 123 ? "lifted" : "ground"} d={!front && !compact && end[1] < 123 ? `M${end[0]-4.5} ${end[1]-5}Q${end[0]} ${end[1]-8} ${end[0]+4.5} ${end[1]-5}L${end[0]+5} ${end[1]+2}Q${end[0]} ${end[1]+6} ${end[0]-5} ${end[1]+2}Z` : `M${end[0] - 4.5} ${end[1] - 2}Q${end[0]} ${end[1] - 5} ${end[0] + 4.5} ${end[1] - 2}L${end[0] + 5} ${end[1] + 1}Q${end[0]} ${end[1] + 3} ${end[0] - 5} ${end[1] + 1}Z`} fill={!front && end[1] < 123 ? '#F8DFA0' : colors.trim} strokeWidth={1.3}/>}
      {arm && side === 'right' && <RewardArt look={look} pose={pose} layer="wrist"/>}
    </G>;
  };
  const hand = (side: Side) => { const [x, y] = j[`${side}Hand`], s = side === 'left' ? 1 : -1; return <Path key={side} data-mitten={side} d={`M${x - s * 2.5} ${y - 2}Q${x - s * 4} ${y + 3.5} ${x} ${y + 4}Q${x + s * 4} ${y + 4} ${x + s * 3} ${y}Q${x + s * 6} ${y - 1} ${x + s * 4} ${y - 3}Q${x + s * 2.5} ${y - 4} ${x + s * 1.5} ${y - 2}Z`} fill={skin} strokeWidth={1.2}/>; };
  const long = look.hairStyle === 'ponytail' || look.hairStyle === 'braids';
  const hairSwing = pose.frame !== undefined && (pose.frame < 8 || pose.frame >= 16) ? Math.sin((pose.frame >= 16 ? pose.frame-16+.5 : pose.frame)*Math.PI/4)*7 : 0;
  const rearHair = <G fill={hair}>
    {front && long && !compact && (look.hairStyle === 'ponytail' ? <Path d={`M${hx + 10} ${hy - 6}Q${hx + 31} ${hy - 11} ${hx + 24} ${hy + 18}Q${hx + 22} ${hy + 33} ${hx + 11} ${hy + 31}Q${hx + 19} ${hy + 17} ${hx + 9} ${hy + 7}Z`}/> : ([-1, 1] as const).map(s => <G key={s}><Path d={`M${hx + s * 13} ${hy + 3}Q${hx + s * 25} ${hy + 13} ${hx + s * 19} ${hy + 31}L${hx + s * 12} ${hy + 31}Q${hx + s * 15} ${hy + 17} ${hx + s * 10} ${hy + 8}Z`}/>{[14, 21, 28].map(y => <Path key={y} d={`M${hx + s * 13} ${hy + y}l${s * 6} -3`} strokeWidth={1}/>) }<Circle cx={hx + s * 15} cy={hy + 31} r={2.8} fill={colors.trim}/></G>))}
    {front && <Ellipse cx={hx} cy={hy} rx={r + .7} ry={r + (hasHat ? 0 : 2)}/>}
  </G>;
  const backpack = <G transform={`translate(${a.torso[0] - (compact ? 10 : 0)} ${a.torso[1]})`}><Rect x={compact ? -9 : -12} y={compact ? -3 : -8} width={compact ? 18 : 24} height={compact ? 13 : 28} rx={7} fill="#D2A45E"/><Rect x={compact ? -6 : -8} y={compact ? 1 : 5} width={compact ? 12 : 16} height={compact ? 7 : 11} rx={3} fill="#F4CC76"/><Path d={compact ? "M-3 -3Q0 -7 3 -3" : "M-4 -8Q0 -16 4 -8"} fill="none" strokeWidth={2}/></G>;
  return <G stroke={ink} strokeWidth={1.35} strokeLinejoin="round" strokeLinecap="round">
    <G data-layer="rear-accessory">{look.accessory === 'backpack' && front && backpack}</G>
    <G data-layer="rear-hair">{rearHair}</G>
    <G data-layer="rear-limbs">{limb('left', false)}{limb('right', false)}{limb(rearArm, true)}{!front && !compact && hand(rearArm)}</G>
    <G data-layer="body"><Path d={`M${hx - 5} ${hy + r - 3}L35 ${sy + 3}H45L${hx + 5} ${hy + r - 3}Z`} fill={skin}/><Path d={`M26 ${sy}Q40 ${sy - (compact ? 2 : 7)} 54 ${sy}L54 ${hip + 2}H26Z`} fill={skin}/><Ellipse cx={hx - r} cy={hy + 3} rx={3} ry={4} fill={skin}/><Ellipse cx={hx + r} cy={hy + 3} rx={3} ry={4} fill={skin}/>
      {!compact && <Circle cx={hx} cy={hy} r={r} fill={skin}/>}</G>
    <G data-layer="clothing"><Path d={`M27 ${hip - 8}H53L55 ${hip + 6}H43L40 ${hip + 1}L37 ${hip + 6}H25Z`} fill={colors.secondary}/>
      <Path d={compact ? `M26 ${sy}Q40 ${sy-8} 54 ${sy}Q63 122 48 127Q28 133 24 120Z` : `M26 ${sy - 1}Q40 ${sy - (compact ? 2 : 7)} 54 ${sy - 1}L${look.outfit === 'sundress' ? 60 : 55} ${hip + (look.outfit === 'sundress' ? 12 : -5)}Q40 ${hip + (look.outfit === 'sundress' ? 17 : 0)} ${look.outfit === 'sundress' ? 20 : 25} ${hip + (look.outfit === 'sundress' ? 12 : -5)}Z`} fill={colors.primary}/>
      {!compact && <>{!front && look.outfit === 'hoodie' && <Path d={`M30 ${sy}Q40 ${sy + 22} 50 ${sy}Q40 ${sy - 5} 30 ${sy}Z`} fill={colors.secondary} strokeWidth={1.2}/>}<Path d={`M34 ${sy - 3}Q40 ${sy + 5} 46 ${sy - 3}`} fill="none" stroke={colors.trim} strokeWidth={2.5}/>
        {front && look.outfit === 'island' && <G strokeWidth={0} fill={colors.trim}><Path d={`M39 ${sy + 11}q-10 -7 -9 3q1 7 10 9q9-5 9-11q-1-7-10-1Z`}/><Path d={`M40 ${sy + 13}v8`} stroke={colors.primary} strokeWidth={1}/></G>}
        {front && look.outfit === 'explorer' && <G fill={colors.trim}><Path d={`M27 ${sy}L35 ${sy + 3}L35 ${hip - 5}H25Z`}/><Path d={`M53 ${sy}L45 ${sy + 3}L45 ${hip - 5}H55Z`}/><Path d={`M28 ${sy + 17}H33V${sy + 23}H28ZM47 ${sy + 17}H52V${sy + 23}H47Z`} fill={colors.secondary} strokeWidth={1}/></G>}
        {front && look.outfit === 'hoodie' && <><Path d={`M34 ${hip - 15}Q40 ${hip - 19} 46 ${hip - 15}L48 ${hip - 8}H32Z`} fill={colors.secondary} strokeWidth={1}/><Path d={`M36 ${sy + 3}v8M44 ${sy + 3}v8`} stroke={colors.trim} strokeWidth={1.2}/></>}
        {look.outfit === 'sundress' && <G fill={colors.trim} strokeWidth={0}>{[31, 43, 51].map((x, i) => <Circle key={x} cx={x} cy={sy + 15 + i * 8} r={2.3}/>)}</G>}
      </>}
      <RewardArt look={look} pose={pose} layer="clothing"/>{compact && look.accessory === 'backpack' && backpack}
    </G>
    <G data-layer="front-limbs">{limb(frontArm, true)}</G>
    <G data-layer="hands">{front || compact ? <>{hand('left')}{hand('right')}</> : hand(frontArm)}</G>
    <RewardArt look={look} pose={pose} layer="neckwear"/><G data-layer="front-hair">{compact && <Circle cx={hx} cy={hy} r={r} fill={hair}/>}

      {front ? <Path d={`M${hx - r} ${hy}Q${hx - r - 2} ${hy - r - (hasHat ? 0 : 4)} ${hx + 1} ${hy - r}Q${hx + r + 4} ${hy - r - 1} ${hx + r} ${hy + 1}L${hx + 10} ${hy - 7}Q${hx - 2} ${hy - 3} ${hx - 9} ${hy - 10}L${hx - 13} ${hy + 2}Z`} fill={hair}/> : !compact && <G fill={hair} data-back-hair={look.hairStyle}>
        <Path d={`M${hx-21} ${hy+1}Q${hx-24} ${hy-23} ${hx} ${hy-23}Q${hx+24} ${hy-23} ${hx+21} ${hy+1}L${hx+17} ${hy+12}Q${hx+10} ${hy+18} ${hx} ${hy+17}Q${hx-10} ${hy+18} ${hx-17} ${hy+12}Z`}/>
        <Path d={`M${hx-12} ${hy+8}Q${hx-7} ${hy+13} ${hx} ${hy+13}M${hx+12} ${hy+8}Q${hx+7} ${hy+13} ${hx+3} ${hy+13}`} fill="none" stroke="#FFFFFF" opacity={.18} strokeWidth={1.2}/>
        {look.hairStyle === 'curls' && [-17,-8,2,12,18].map((x,i)=><Circle key={x} cx={hx+x} cy={hy+9+(i%2?5:0)} r={5} fill={hair} strokeWidth={0}/>)}
      </G>}

      {look.hairStyle === 'curls' && !compact && [-18, -9, 0, 9, 18].map((x, i) => <Circle key={x} cx={hx + x} cy={hy - (hasHat ? 14 : 18) + (i % 2 ? -1 : 1)} r={hasHat ? 4 : 6.5} fill={hair} strokeWidth={1}/>)}
    {!front && !compact && long && <G fill={hair}>
      {look.hairStyle === 'ponytail' ? (() => { const swing = hairSwing; return <G><Path d={`M${hx-4} ${hy-10}Q${hx+17+swing} ${hy-8} ${hx+11+swing} ${hy+15}Q${hx+7+swing} ${hy+32} ${hx-4+swing} ${hy+28}Q${hx+3+swing} ${hy+14} ${hx-6} ${hy+1}Z`}/><Ellipse cx={hx} cy={hy-7} rx={5.5} ry={3.4} fill={colors.primary} strokeWidth={1.2}/></G>; })() : [-1,1].map(side=><G key={side} transform={`translate(${hairSwing * .55} 0)`}><Path d={`M${hx+side*14} ${hy+8}Q${hx+side*22} ${hy+24} ${hx+side*17} ${hy+37}L${hx+side*10} ${hy+36}Q${hx+side*14} ${hy+22} ${hx+side*9} ${hy+11}Z`}/>{[18,24,30].map(y=><Path key={y} d={`M${hx+side*12} ${hy+y}l${side*7} 3`} strokeWidth={1}/>)}<Circle cx={hx+side*14} cy={hy+36} r={3.2} fill={colors.primary} strokeWidth={1.1}/></G>)}
    </G>}
    </G>
    <RewardArt look={look} pose={pose} layer="hair"/><G data-layer="face">{front && <G><Ellipse cx={hx - 10} cy={hy + 7} rx={3.5} ry={1.7} fill="#E88D7D" opacity={.5} strokeWidth={0}/><Ellipse cx={hx + 10} cy={hy + 7} rx={3.5} ry={1.7} fill="#E88D7D" opacity={.5} strokeWidth={0}/>
      {pose.expression === 'proud' ? <Path d={`M${hx - 9} ${hy + 2}q3-4 6 0M${hx + 3} ${hy + 2}q3-4 6 0`} fill="none"/> : <G fill={ink} strokeWidth={0}><Ellipse cx={hx - 7} cy={hy + 2} rx={2.7} ry={3.5}/><Ellipse cx={hx + 7} cy={hy + 2} rx={2.7} ry={3.5}/><Circle cx={hx - 6.2} cy={hy + 1} r={1} fill="white"/><Circle cx={hx + 7.8} cy={hy + 1} r={1} fill="white"/></G>}
      <Path d={`M${hx} ${hy + 4}l-1 3h2`} strokeWidth={.8} opacity={.5} fill="none"/>
      {pose.expression === 'surprised' ? <Ellipse cx={hx} cy={hy + 11} rx={2.8} ry={3} fill="#7A494B"/> : <Path d={`M${hx - 4} ${hy + 10}q4 ${pose.expression === 'focused' || pose.expression === 'thinking' ? 0 : 5} 8 0`} fill="none" strokeWidth={1.3}/>}
      {pose.expression === 'thinking' && <Path d={`M${hx - 10} ${hy - 3}l6-2M${hx + 4} ${hy - 4}l6 2`} fill="none" strokeWidth={1.1}/>}
    </G>}</G>
    <G data-layer="hat" transform={`translate(${a.headTop[0]} ${a.headTop[1]})`}>
      {look.hat === 'sunhat' && <G fill="#F4CC76"><Path d={compact ? 'M-11 3L-10 -2Q0 -5 10 -2L11 3Z' : 'M-19 7L-16 -2Q0 -6 16 -2L19 7Z'}/><Path d={compact ? 'M-15 4Q0 0 15 4Q0 8-15 4Z' : 'M-28 9Q-27 4-19 5H19Q27 4 28 9Q0 18-28 9Z'}/><Path d={compact ? 'M-10 1H10' : 'M-12 2Q0 5 12 2'} stroke="#D47F66" strokeWidth={3}/></G>}
      {look.hat === 'cap' && <G fill={colors.secondary}><Path d={compact ? 'M-12 4Q-11-5 0-5Q11-5 12 4Z' : 'M-23 10Q-24-5 0-5Q23-4 23 10Z'}/><Path d={front ? 'M0 5Q20 1 22 8Q12 12 0 8Z' : 'M-8 5H8V10H-8Z'} fill={colors.primary}/></G>}
      {look.hat === 'flower-crown' && <G><Path d="M-16 6Q0-1 16 6" stroke="#639477" strokeWidth={3} fill="none"/>{[-12, 0, 12].map((x, i) => <G key={x} transform={`translate(${x} ${i === 1 ? 1 : 5})`} strokeWidth={.6}>{[0, 72, 144, 216, 288].map(angle => <Ellipse key={angle} cx={0} cy={-2.3} rx={1.9} ry={2.8} transform={`rotate(${angle})`} fill="#FFF0D1"/>)}<Circle r={1.6} fill="#E9AF4A"/></G>)}</G>}
    </G>
    <RewardArt look={look} pose={pose} layer="hat"/><G data-layer="foreground-accessory"><RewardArt look={look} pose={pose} layer="accessory"/>{look.accessory === 'backpack' && (!front ? !compact && backpack : <G fill="none" stroke="#D2A45E" strokeWidth={3}><Path d={`M28 ${sy}L31 ${hip - 9}M52 ${sy}L49 ${hip - 9}`}/></G>)}
      {look.accessory === 'glasses' && front && <G fill="#E7F5ED" fillOpacity={.22} strokeWidth={1.3}><Rect x={hx - 13} y={hy - 2} width={11} height={9} rx={3}/><Rect x={hx + 2} y={hy - 2} width={11} height={9} rx={3}/><Path d={`M${hx - 2} ${hy + 1}h4M${hx - 16} ${hy}h3M${hx + 13} ${hy}h3`} fill="none"/></G>}
      {look.accessory === 'glasses' && !front && <Path d={`M${hx - r} ${hy + 1}l-2-2M${hx + r} ${hy + 1}l2-2`} fill="none"/>}
    </G>
  </G>;
}
/** Static SVG; callers pre-render frames and swap opacity. Never runs a timer or worklet. */
export const Islander = memo(function Islander({ view = 'front', pose = view === 'back' ? 0 : 'idle', look = defaultLook, size = 120 }: { view?: View; pose?: string | number | Pose; look?: IslanderLook; size?: number }) {
  return <Svg width={size * 80 / 132} height={size} viewBox="0 0 80 132" accessible={false}><IslanderShape pose={resolvePose(view, pose)} look={look}/></Svg>;
});
/** Separate foreground prop: does not distort or hide the character's skeleton. */
export const IslanderDesk = memo(function IslanderDesk({ size = 120 }: { size?: number }) {
  return <Svg width={size * 80 / 132} height={size} viewBox="0 0 80 132" accessible={false}><G stroke={ink} strokeWidth={1.35} strokeLinejoin="round"><Path d="M13 90H67L72 97H8Z" fill="#D2A45E"/><Path d="M15 97V130H20V97M60 97V130H65V97" fill="#B98458"/><Path d="M29 89L44 87L51 92L36 94Z" fill="#FFF7DE"/><Path d="M48 89L53 81" stroke="#364D79" strokeWidth={2}/></G></Svg>;
});
