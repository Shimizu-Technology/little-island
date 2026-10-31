import React from 'react';
import Svg, { G, Rect } from 'react-native-svg';
import { IslanderShape } from '../../islander/rig/Islander';
import { poseBox, resolvePose } from '../../islander/rig/poses';
import { defaultLook, type IslanderLook } from '../../islander/look';
import { SeatShape, seatSockets } from './SeatArt';
/** Dev/test fixture. Uses the exact published sockets, never screenshot-only offsets.
 * Art box and socket at values are square-normalised; mirroring wraps all three layers.
 * Character size is 224 scene units (same as home); art size is supplied by itemSize.
 */
export function SocketGallery({ id, index = 0, mirrored = false, look = defaultLook, size = 260 }: { id: string; index?: number; mirrored?: boolean; look?: IslanderLook; size?: number }) {
  const socket = seatSockets[id][index], pose = resolvePose('front', socket.kind === 'sit' ? 'sit-front' : socket.kind === 'lie' ? 'lie-asleep' : 'bathe');
  const box = poseBox(pose), scale = 224 / 132 * 150 / size;
  const x = socket.at[0]*150-box.anchor[0]*scale, y = socket.at[1]*150-box.anchor[1]*scale;
  return <Svg width={size} height={size + 110} viewBox="0 -60 150 210" accessible={false}>
    <Rect x={0} y={0} width={150} height={150} fill="#F3E7D1"/>
    <G transform={mirrored ? 'translate(150 0) scale(-1 1)' : undefined}>
      <SeatShape id={id} layer="back"/>
      <G transform={`translate(${x} ${y}) scale(${scale})`}><IslanderShape pose={pose} look={look}/></G>
      <SeatShape id={id} layer="front"/>
    </G>
  </Svg>;
}
