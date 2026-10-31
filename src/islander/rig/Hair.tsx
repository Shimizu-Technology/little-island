import React from 'react';
import { G, Path } from 'react-native-svg';
import { hairColors, type IslanderLook } from '../look';
import type { Pose } from './poses';

/** Original island silhouettes, drawn in head-local coordinates. No clipping IDs. */
export function Hair({ look, pose, rear = false }: { look: IslanderLook; pose: Pose; rear?: boolean }) {
  const style = look.hairStyle, front = pose.view === 'front', [x,y] = pose.joints.head;
  const covered = !['none','flower-crown','runner-headband'].includes(look.hat);
  const swing = pose.frame !== undefined && (pose.frame < 8 || pose.frame >= 16) ? Math.sin((pose.frame >= 16 ? pose.frame-16+.5 : pose.frame)*Math.PI/4)*4 : 0;
  const long = ['long-straight','long-wavy','bob'].includes(style);
  const backs: Record<IslanderLook['hairStyle'], string> = {
 crop:'M-27 3L-29-8L-25-11L-26-21L-18-23L-13-30L-4-28L4-31L12-27Q27-27 28-12L26 4L21 9L18 7L14 16L7 13L1 18L-7 13L-15 16L-19 8L-24 10Z',
 curls:'M-27 6Q-35 0-28-6Q-35-14-27-19Q-28-29-17-27Q-13-35-4-29Q5-35 12-29Q23-32 26-23Q35-21 29-11Q36-4 28 3Q32 12 23 14Q18 23 10 17Q0 24-8 18Q-18 24-22 15Q-31 16-27 6Z',
 ponytail:'M-27 7Q-31-13-21-24Q-12-31 2-28Q18-33 26-20L29-7L25-10L27 9L20 16L11 13L3 18L-9 15L-21 17Z',
 braids:'M-27 4Q-32-16-20-24L-10-29L0-27L9-30Q27-26 29-10L26 6L20 15L11 12L0 17L-12 12L-22 16Z',
 'buzz-cut':'M-27-1Q-28-27 0-27Q28-27 27-1L25 9L18 15Q0 21-18 15L-25 9Z',
 'short-spiky':'M-27 5L-30-11L-23-12L-25-25L-15-22L-8-33L0-26L9-32L16-24L26-26L24-16L31-13L27 3L29 10L21 8L18 18L10 13L2 19L-7 14L-17 18L-20 9L-27 12Z',
 'side-part':'M-27 4Q-33-13-21-24Q-11-33 7-28Q24-30 28-14L30-8L25-10L27 6L23 15L17 11L10 18L2 15L-8 19L-19 14L-24 16Z',
 'afro-puffs':'M-27 5Q-33-3-27-10Q-31-19-21-23Q-14-32-4-27Q7-33 16-26Q28-26 27-15Q34-8 28 0Q33 10 23 13Q17 23 7 17Q-3 23-12 17Q-24 21-27 5Z',
 'top-knot':'M-26 5Q-30-16-17-24L-7-29L1-27L11-29Q28-24 28-7L25 9L19 15L12 12L3 18L-7 14L-16 17L-23 12Z',
 'long-straight':'M-27 3Q-31-19-19-26Q-7-32 1-28Q16-32 25-20L28 4L26 22L29 39L22 45L18 39L12 47L6 42L0 48L-7 42L-14 47L-18 40L-25 44L-29 37L-26 20Z',
 'long-wavy':'M-27 2Q-34-11-25-20Q-23-30-11-28Q-4-33 4-28Q19-32 26-20Q33-11 27-2Q35 10 28 19Q35 32 26 42L19 46L17 39Q9 50 3 43Q-5 51-12 42L-18 46Q-30 45-28 33Q-35 23-28 15Q-34 8-27 2Z',
 pigtails:'M-27 5Q-31-15-21-23Q-10-31 0-27Q12-32 24-21Q31-12 27 5L22 13L14 10L5 17L-3 14L-13 18L-22 12Z',
 bob:'M-28 7Q-33-15-20-25Q-10-32 2-28Q19-32 26-18L29 8L27 19L31 25L22 29L16 25L9 31L1 28L-7 32L-14 27L-24 30L-30 24L-27 18Z',
 'mohawk-fade':'M-27 1Q-28-23-10-25L-8-32L0-28L7-33L10-25Q28-23 27 1L24 11L17 16L8 12L0 19L-8 12L-17 16L-24 11Z',
  };
  const fringe: Record<IslanderLook['hairStyle'], string> = {
    crop: 'M-27 3L-29-9L-25-11L-26-22L-18-23L-13-30L-4-28L4-31L13-27Q27-25 28-12L26 3L21-3L16-1L12-10L6-5L0-8L-6-3L-13-10L-18-3L-23 2Z',
    curls: 'M-27 4Q-34-2-28-9Q-34-18-23-22Q-25-32-13-29Q-9-33 0-30Q12-34 17-28Q30-29 28-18Q36-11 28-4L25 5Q17 9 14 0Q5 3 0-3Q-9 4-15-2Q-22 9-27 4Z',
    ponytail: 'M-27 5Q-32-14-21-24Q-10-32 3-28Q21-32 27-16L29-7L25-9L27 5L22 9L20-6L14-7L7-17Q1-7-8-5L-6-10L-19-4L-22 8Z',
    braids: 'M-27 6Q-33-13-22-24Q-10-32 0-28Q13-32 25-21L29-9L26 6L22 11L19-7L11-9L6-14L0-21L-6-13L-12-9L-20-6L-22 11Z',
    'buzz-cut': 'M-27-1Q-28-27 0-27Q28-27 27-1L23-6Q0-13-23-6Z',
    'short-spiky': 'M-27 3L-29-13L-22-12L-24-26L-14-22L-9-33L0-26L9-32L15-24L25-27L24-17L30-15L27 3L20-5L11-11L1-7L-12-11L-21-3Z',
    'side-part': 'M-27 4Q-33-11-23-23Q-13-33 4-29Q24-31 28-13L30-7L25-9L27 4L22-1L19-8L14-10L10-20Q5-8-5-4L-4-9Q-13 0-22-1L-23 6Z',
    'afro-puffs': 'M-27 7Q-34 0-28-8Q-31-19-21-23Q-12-31-3-26Q9-32 17-25Q29-24 27-14Q33-5 27 6L22 10L20-4L13-4L7-9L0-17L-8-8L-14-5L-20-4L-22 11Z',
    'top-knot': 'M-27 7Q-32-14-19-24L-9-29L0-27L10-29Q30-24 28-7L26 6L22 11L19-5L11-9L6-12L0-21L-7-12L-13-8L-20-5L-22 11Z',
    'long-straight': 'M-28 8Q-32-14-23-25Q-11-33 0-28Q13-32 24-23L29-9L28 12L26 25L21 30L18 25L20 12L20-6L12-7L7-12L0-20L-7-12L-12-7L-20-6L-20 12L-18 25L-23 30L-28 25Z',
    'long-wavy': 'M-28 8Q-34-5-28-14Q-29-27-15-28Q-6-33 1-28Q16-32 25-23Q33-13 28-4Q35 7 28 18L30 30L24 33L23 17Q27 7 21-5Q8-6 1-17Q-7-8-20-5Q-27 6-23 17L-24 33L-30 30L-27 18Z',
    pigtails: 'M-27 7Q-32-14-20-24Q-9-32 0-27Q13-32 24-20L29-8L27 6L22 11L20-5L13-6L7-11L0-20L-7-11L-13-6L-20-5L-22 11Z',
    bob: 'M-28 9Q-33-14-22-25Q-9-33 0-28Q15-32 25-21L29-7L28 14L24 24L29 26L22 29L16 25L19 12L18-6L12-6L6-10L-4-18L-10-9L-17-5L-21-5L-19 14L-17 25L-24 29L-29 26L-26 22Z',
    'mohawk-fade': 'M-27 1Q-28-23-10-25L-8-32L0-28L7-33L10-25Q28-23 27 1L23-5Q16-9 10-17L7-9L0-12L-6-8L-12-17L-23-4Z',
  };
  const tail = style === 'ponytail' ? `M18-23Q34-31 35-15Q31-5 35 2L31 0Q38 13 32 21L33 29L25 25L20 31L16 24Q24 12 19 4L14-5Z` : style === 'braids' ? 'M-23-1Q-32 9-27 16Q-31 23-24 29Q-27 35-20 40L-14 37Q-18 30-16 25Q-13 18-19 13L-17 2ZM23-1Q32 9 27 16Q31 23 24 29Q27 35 20 40L14 37Q18 30 16 25Q13 18 19 13L17 2Z' : style === 'pigtails' ? 'M-23-9Q-33-12-34 5Q-34 17-28 28Q-18 25-21 15Q-27 6-19-1ZM23-9Q38-12 34 5Q39 17 28 28Q18 25 21 15Q27 6 19-1Z' : style === 'afro-puffs' ? 'M-21-13Q-34-7-33-20Q-34-26-32-30Q-32-33-24-34Q-15-34-12-31Q-5-26-13-20Q-13-13-21-13ZM21-13Q35-7 36-20Q39-26 32-30Q32-33 24-34Q15-34 12-31Q5-26 13-20Q13-13 21-13Z' : style === 'top-knot' ? 'M-14-23Q-21-30-12-35Q-10-39-2-36Q9-40 14-32Q20-27 11-22L4-24L-4-21Z' : '';
  const curtain = backs[style];
  const strands = style === 'braids' ? 'M-26 12L-18 17M-26 23L-18 28M-24 32L-17 36M26 12L18 17M26 23L18 28M24 32L17 36' : style === 'long-wavy' ? 'M-22 5Q-28 13-22 21Q-17 29-22 39M23 3Q28 13 22 22Q17 32 22 39M-10 25Q-14 33-9 41M10 25Q15 34 10 41' : style === 'curls' ? 'M-23-16q-4-6 2-7M-12-21q-2-7 4-5M2-22q2-7 7-3M19-16q6-4 6 2' : style === 'buzz-cut' || style === 'mohawk-fade' ? 'M-23-7l2-2m1-5l2-2m38 9l-2-2m-1-5l-2-2M-14-19l2-1m24 0l2 1' : 'M-20-14Q-18-22-9-23M5-24Q15-24 21-16';
  const flow: Record<IslanderLook['hairStyle'], string> = {
 crop:'M-13-27Q-11-17-18-9M-3-27Q0-16-6-7M7-27Q16-19 18-9M20-20l5 9',
 curls:'M-23-16q-4-6 2-7M-12-21q-2-7 4-5M2-22q2-7 7-3M19-16q6-4 6 2M-23 2q-4 5 2 8M-10 9q-3 7 3 6M6 10q3 7 7 2M22 4q5 4 0 8',
 ponytail:'M3-27Q12-16 24-9M-6-26Q-14-20-23-8M-17-21Q-15-12-22-4M8-22Q13-14 20-11',
 braids:'M0-27V-20M-3-23Q-10-12-22-8M4-22Q12-12 22-8M-22 1Q-9 10-3 13M22 1Q10 10 4 13',
 'buzz-cut':'M-23-7l2-2m1-5l2-2m38 9l-2-2m-1-5l-2-2M-14-19l2-1m24 0l2 1M-12 8l2 1M0 11h1M11 8l2-1',
 'short-spiky':'M-18-22L-15-14M-7-27L-4-15M8-26L5-13M21-21L16-12M-18 3l3 7M-3 5l4 8M17 2l-3 8',
 'side-part':'M9-27L10-20M6-25Q0-12-17-5M0-26Q-10-19-22-13M13-24Q24-20 24-12M-19 5Q-4 10 6 3M8 5Q16 9 20 3',
 'afro-puffs':'M-24-23q-6-5-5-1M-17-30q7-3 8 2M20-29q6-5 9 1M25-20q7-4 7 2M-17-18q2-6 7-4M3-22q8-5 12 3M-17 5q-2 7 5 7M3 9q4 8 9 1',
 'top-knot':'M0-28V-20M-6-26Q-10-15-23-7M6-26Q13-13 23-7M-20 2Q-14 12-4 13M20 2Q14 12 5 13M-9-32Q-1-27 7-32',
 'long-straight':'M0-28V-18M-6-24Q-23-15-22 4L-23 35M6-24Q24-14 22 5L23 35M-14 1L-14 37M-6 3L-5 39M4 3L4 40M13 1L14 37',
 'long-wavy':'M1-28V-18M-5-25Q-21-22-24-10M7-24Q23-21 24-9M-22 4Q-29 13-22 21Q-16 30-22 38M22 3Q30 13 22 23Q17 30 23 38M-11 2Q-17 14-10 23Q-5 31-11 39M5 2Q14 12 7 22Q1 33 6 40',
 pigtails:'M0-27V-19M-4-24Q-12-12-23-7M4-24Q13-12 23-7M-22 2Q-8 12-2 13M22 2Q8 12 3 13',
 bob:'M-4-28V-17M-7-25Q-22-21-24-8M2-25Q17-23 23-12M-23 6L-22 22M-15 5L-14 23M-5 5L-5 25M5 5L5 24M15 4L16 22M23 3L24 20',
 'mohawk-fade':'M-7-26L-5-18M3-27L1-17M7-10L5 6M-4-9L-3 7M-23-7l2-2M23-7l-2-2M-17-16l2-1M17-16l-2-1',
  };
  const crownStrands = front && style === 'mohawk-fade' ? 'M-7-26L-5-18M3-27L1-17M-23-7l2-2M23-7l-2-2M-17-16l2-1M17-16l-2-1' : front ? flow[style].split('M').filter(part => /^-?[\d.]+-/.test(part)).map(part=>'M'+part).join('') : flow[style];
  const backCap = backs[style];
  if (pose.compact) return rear ? null : <G data-back-hair={style}><Path d={`M${x-12} ${y}Q${x-13} ${y-12} ${x} ${y-12}Q${x+13} ${y-12} ${x+12} ${y}Q${x} ${y+13} ${x-12} ${y}Z`} fill={hairColors[look.hairColor]}/></G>;
  if (rear && !front) return null;
  const showTail = rear || !front;
  return <G data-back-hair={!front ? style : undefined} data-hair={style} transform={`translate(${x} ${y})`} fill={hairColors[look.hairColor]}>
    {showTail && <G transform={`translate(${swing} 0)`}>
      {long && front && <><Path d={curtain}/><Path d="M17-4Q29 15 21 39L18 34L12 44L9 39L5 44L3 4Z" fill="#201D26" fillOpacity={.25} strokeWidth={0}/></>}
      {long && front && <Path d={long ? flow[style] : strands} fill="none" stroke="#201D26" strokeOpacity={.45} strokeWidth={1.1}/>}
      {tail && !(covered && style === 'top-knot') && <><Path d={tail}/><Path d={long ? flow[style] : strands} fill="none" stroke="#201D26" strokeOpacity={.45} strokeWidth={1.1}/></>}
    </G>}
    {(!rear || front) && <G transform={covered ? 'translate(0 2) rotate(0) scale(1 .88)' : 'translate(0 0) rotate(0) scale(1 1)'}>
      <Path d={rear ? backCap : front ? fringe[style] : backCap}/>
      <Path d={front && !rear ? 'M-26-1Q-21-7-18-10L-21 0L-23 7Z' : long ? 'M17-18Q29-3 23 16L26 32L19 41L17 36L12 43Q20 14 16 0Z' : 'M-24 6L-18 9L-12 8L-6 12L1 10L8 13L16 9L24 6L23 12L15 15L8 16L0 19L-8 16L-16 17L-23 12Z'} fill="#201D26" fillOpacity={.25} strokeWidth={0}/>
      <Path d={crownStrands} fill="none" stroke="#201D26" strokeOpacity={.5} strokeWidth={1.05}/>
      <Path d={"M-22-18Q-20-24-15-24L-18-19ZM-9-25L-4-26L-6-22L-10-21ZM12-24Q18-23 20-18L16-19Z"+(!front&&long?"M-23 10Q-26 17-22 22Q-23 16-23 10ZM-11 24Q-8 29-10 34Q-13 29-11 24ZM8 10Q12 16 9 20Q10 15 8 10Z":"")} fill="#FFF4DA" fillOpacity={.22} strokeWidth={0}/>
      {!front && style === 'side-part' && <Path d="M7-23Q0-10-20-5M9-20Q18-14 21-6" fill="none" strokeWidth={1.1}/>}
      {!front && style === 'short-spiky' && <Path d="M-25-18l1-9 10 4 6-9 9 7 8-6 6 8 9-2 -1 8"/>}
      {!front && style === 'mohawk-fade' && <Path d="M-8 11L-10-26L-7-32L0-28L7-33L10-26L8 11Q0 17-8 11Z"/>}
    </G>}
    {showTail && ['ponytail','braids','pigtails'].includes(style) && <Path d={style==='ponytail'?'M12-10l7 2':style==='braids'?'M-24 35l7-1M17 34l7 1':'M-27 4l7 2M20 6l7-2'} fill="none" stroke="#E5B77D" strokeWidth={2.6}/ >}
  </G>;
}
