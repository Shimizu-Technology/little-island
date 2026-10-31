import type { StyleItem } from './catalog';
/** V3 rig-space crops: head above y=70, torso at 71–100, feet at 128. */
export function thumbnailFocus(item: Pick<StyleItem, 'category' | 'value'>) {
  if (['brows', 'lashes', 'freckles', 'cheeks'].includes(item.category)) return { view: 'front' as const, box: '17 20 46 46' };
  if (item.category === 'bottom') return { view: 'front' as const, box: '12 88 56 56' };
  if (item.category === 'shoes' || item.category === 'shoeColor') return { view: 'front' as const, box: '14 101 52 40' };
  if (item.category === 'top') return { view: 'front' as const, box: '13 63 54 54' };
  if (item.category === 'accessory') {
    if (item.value === 'calculator-watch') return { view: 'front' as const, box: '39 68 52 52' };
    if (item.value === 'backpack') return { view: 'back' as const, box: '12 48 62 62' };
    if (['flower-lei', 'checker-scarf'].includes(item.value)) return { view: 'front' as const, box: '9 43 62 62' };
  }
  if (item.category === 'palette') return { view: 'front' as const, box: '13 63 54 54' };
  return { view: 'front' as const, box: ['hat', 'hairStyle', 'hairColor', 'accessory'].includes(item.category) ? '5 0 70 70' : '-26 0 132 132' };
}
