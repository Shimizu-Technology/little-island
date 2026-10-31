import type { Capability, ItemVisualState } from '../world';
import type { ItemId } from '../catalog';
export const foodIds = ['mango','banana','rice-ball','cupcake'] as const;
export const drinkIds = ['coconut-drink','juice'] as const;
export const toyIds = ['teddy','ball','book','shell'] as const;
export const holdableIds = [...foodIds,...drinkIds,...toyIds] as const;
export type HoldableId = typeof holdableIds[number];
export const livingCapabilities: Partial<Record<ItemId, Capability>> = {
  ...Object.fromEntries(foodIds.map(id=>[id,{moveInPlay:true,holdable:true,edible:'food'}])),
  ...Object.fromEntries(drinkIds.map(id=>[id,{moveInPlay:true,holdable:true,edible:'drink'}])),
  ...Object.fromEntries(toyIds.map(id=>[id,{moveInPlay:true,holdable:true}])),
  'floor-lamp':{moveInPlay:true,toggle:'light'},
  'table-lamp':{moveInPlay:true,toggle:'light'},
  lamp:{moveInPlay:true,toggle:'light'},
  'sink-counter':{moveInPlay:false,toggle:'water'},
  tv:{moveInPlay:true,toggle:'power'}, radio:{moveInPlay:true,toggle:'power'},
  fridge:{moveInPlay:true,toggle:'open',dispenses:['mango','banana','juice','rice-ball']},
  'fruit-bowl':{moveInPlay:true,dispenses:['mango','banana','coconut-drink']},
};
export function dispenserChoices(item: ItemId, state: ItemVisualState = {}): readonly ItemId[] {
  if(item === 'fridge' && !state.on) return [];
  return livingCapabilities[item]?.dispenses ?? [];
}
/** Scene-unit offsets from source centre. Engine draws these in a separate overlay,
 * never scales them with the small bowl. 48-unit targets, 56-unit spacing; no stock.
 * Clamp the complete fan to the room or dock it if it would cover chrome. */
export function dispenserFan(item: ItemId, state: ItemVisualState = {}) {
  const choices=dispenserChoices(item,state);
  return choices.map((item,index)=>({item,x:(index-(choices.length-1)/2)*56,y:-74-Math.sin((index+1)/(choices.length+1)*Math.PI)*20,size:48}));
}
