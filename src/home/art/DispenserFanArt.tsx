import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import type { ItemId } from '../catalog';
import type { ItemVisualState } from '../world';
import { dispenserFan } from './living';
import { HandProp } from './PropShape';
import type { HoldableId } from './living';
/** Visual only: engine supplies labelled 48-unit tap/drag targets at the same offsets. */
export function DispenserFanArt({item,state}:{item:ItemId;state?:ItemVisualState}) {
  return <Svg width={224} height={120} viewBox="-112 -120 224 120" accessible={false}>
    {dispenserFan(item,state).map(slot=><G key={slot.item} transform={`translate(${slot.x} ${slot.y})`}><Circle r={24} fill="#FFF8E9" stroke="#79BDB1" strokeWidth={1.5}/><G transform="translate(-15 -15) scale(1.25)"><HandProp id={slot.item as HoldableId}/></G></G>)}
  </Svg>;
}
