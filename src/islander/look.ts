/** Stable wardrobe IDs. Pure data: no storage, platform imports or worklets. */
export const skinTones = { shell: '#F4D2B4', sand: '#DEAF86', honey: '#CB956D', earth: '#996445', cocoa: '#654332' } as const;
export const hairColors = { midnight: '#302C36', espresso: '#493332', chestnut: '#754A37', auburn: '#9C533B', honey: '#C59752', silver: '#D0C5BD', lagoon: '#387E86', plum: '#825B94', galaxy: '#373666', 'lightning-streak': '#302C36', blonde: '#E4BD69', 'jet-black': '#191B26', copper: '#BA623F', pink: '#E98CAA', 'sky-blue': '#7DC5E6', mint: '#91C9AC' } as const;
export const hairStyles = ['crop', 'curls', 'ponytail', 'braids', 'buzz-cut', 'short-spiky', 'side-part', 'afro-puffs', 'top-knot', 'long-straight', 'long-wavy', 'pigtails', 'bob', 'mohawk-fade'] as const;
export const outfits = ['island', 'sundress', 'explorer', 'hoodie', 'number-tee', 'robot-tee', 'lab-coat', 'lagoon-jersey', 'board-shorts-set', 'polo-shorts', 'aloha-shorts', 'overalls', 'skirt-tee', 'jersey-dress', 'pirate', 'space-suit', 'mix'] as const;
export const tops = ['tee', 'polo', 'aloha', 'tank', 'hoodie-top', 'jersey-top'] as const;
export const bottoms = ['shorts', 'board-shorts', 'skirt', 'trousers', 'cargo-shorts'] as const;
export const builds = ['boy', 'girl', 'neutral'] as const;
export const shoes = ['sneakers', 'sandals', 'boots', 'flip-flops', 'rain-boots'] as const;
export const shoeColors = { cream: '#FFF1D5', lagoon: '#77B9B0', coral: '#E99484', ink: '#4F5365', honey: '#D9B16E', lilac: '#B5A1C9' } as const;
export const presentations = ['boy', 'girl', 'me'] as const;
export const brows = ['soft', 'straight', 'bold', 'arched'] as const;
export const lashes = ['none', 'lashes'] as const;
export const freckles = ['none', 'freckles'] as const;
export const cheeks = ['none', 'rosy'] as const;
export const hats = ['none', 'sunhat', 'cap', 'flower-crown', 'bookworm-beanie', 'woven-sunhat', 'runner-headband', 'captain-cap'] as const;
export const accessories = ['none', 'glasses', 'backpack', 'calculator-watch', 'reading-glasses', 'safety-goggles', 'coder-headset', 'flower-lei', 'checker-scarf'] as const;
export const outfitPalettes = { 'star-math': { primary: '#364D79', secondary: '#283B60', trim: '#F4CC76' }, storyteller: { primary: '#79516F', secondary: '#57415B', trim: '#FFF0D1' }, sunset: { primary: '#F08069', secondary: '#BD695B', trim: '#F4BC62' }, 'star-sneakers': { primary: '#438F92', secondary: '#365E68', trim: '#FFF7E9' }, royal: { primary: '#7859A0', secondary: '#514471', trim: '#F4CC76' }, coral: { primary: '#E99B88', secondary: '#587184', trim: '#FFF0CF' }, lagoon: { primary: '#83BCB4', secondary: '#526E7A', trim: '#FFF0CF' }, twilight: { primary: '#AA99C5', secondary: '#58647D', trim: '#F4D594' } } as const;
export type IslanderLook = Readonly<{ skinTone: keyof typeof skinTones; hairStyle: typeof hairStyles[number]; hairColor: keyof typeof hairColors; outfit: typeof outfits[number]; hat: typeof hats[number]; accessory: typeof accessories[number]; palette?: keyof typeof outfitPalettes; presentation?: typeof presentations[number]; brows?: typeof brows[number]; lashes?: typeof lashes[number]; freckles?: typeof freckles[number]; cheeks?: typeof cheeks[number]; top?: typeof tops[number]; bottom?: typeof bottoms[number]; build?: typeof builds[number]; shoes?: typeof shoes[number]; shoeColor?: keyof typeof shoeColors }>;
export const defaultLook: IslanderLook = Object.freeze({ skinTone: 'honey', hairStyle: 'ponytail', hairColor: 'espresso', outfit: 'island', hat: 'none', accessory: 'none' });
const choices = { skinTone: Object.keys(skinTones), hairStyle: hairStyles, hairColor: Object.keys(hairColors), outfit: outfits, hat: hats, accessory: accessories, palette: Object.keys(outfitPalettes), presentation: presentations, brows, lashes, freckles, cheeks, top: tops, bottom: bottoms, build: builds, shoes, shoeColor: Object.keys(shoeColors) };
const optional = new Set(['palette', 'presentation', 'brows', 'lashes', 'freckles', 'cheeks', 'top', 'bottom', 'build', 'shoes', 'shoeColor']);
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
export function isValidLook(value: unknown): value is IslanderLook {
  if (!record(value) || Object.keys(value).some(k => !Object.hasOwn(choices, k))) return false;
  if (value.outfit === 'mix' && (!Object.hasOwn(value, 'top') || !Object.hasOwn(value, 'bottom'))) return false;
  return Object.entries(choices).every(([k, ids]) => optional.has(k) && !Object.hasOwn(value, k) || typeof value[k] === 'string' && (ids as readonly string[]).includes(value[k] as string));
}
/** Preserve valid selections field by field; never mutate or retain untrusted data. */
export function normalizeLook(value: unknown): IslanderLook {
  const source = record(value) ? value : {};
  const result: Record<string, string> = { ...defaultLook };
  for (const [k, ids] of Object.entries(choices)) if (typeof source[k] === 'string' && (ids as readonly string[]).includes(source[k] as string)) result[k] = source[k] as string;
  if (result.outfit === 'mix') { result.top ??= 'tee'; result.bottom ??= 'shorts'; }
  return result as IslanderLook;
}

/** Freely editable starting points; presentation never restricts wardrobe choices. */
export const presentationPresets = {
  boy: { presentation: 'boy', build: 'boy', hairStyle: 'side-part', outfit: 'polo-shorts', brows: 'straight', lashes: 'none', shoes: 'sneakers', shoeColor: 'cream' },
  girl: { presentation: 'girl', build: 'girl', hairStyle: 'long-wavy', outfit: 'sundress', brows: 'soft', lashes: 'lashes', shoes: 'sandals', shoeColor: 'cream' },
  me: { presentation: 'me', build: 'neutral', hairStyle: 'crop', outfit: 'mix', top: 'tee', bottom: 'shorts', brows: 'soft', lashes: 'none', shoes: 'sneakers', shoeColor: 'cream' },
} as const satisfies Record<typeof presentations[number], Partial<IslanderLook>>;
export const buildFor = (look: IslanderLook) => look.build ?? (look.presentation === 'boy' || look.presentation === 'girl' ? look.presentation : 'neutral');

/** Render-only defaults: explicit saved palette choices always win. */
export const outfitDefaults: Record<typeof outfits[number], { primary: string; secondary: string; trim: string }> = {
 island: outfitPalettes.lagoon, sundress: {primary:'#DF9CAC',secondary:'#9B6E8B',trim:'#FFF0D1'},
 explorer:{primary:'#CBB184',secondary:'#718878',trim:'#EFE4BB'}, hoodie:outfitPalettes.twilight,
 'robot-tee':{primary:'#748FC5',secondary:'#415985',trim:'#FFF0CE'}, 'number-tee':{primary:'#DCA95F',secondary:'#5F7389',trim:'#FFF5DA'}, 'lab-coat':{primary:'#9CC6CB',secondary:'#687E99',trim:'#FFF5E4'},
 'lagoon-jersey':{primary:'#79B5C8',secondary:'#476C94',trim:'#FFF4DF'}, 'board-shorts-set':{primary:'#E5B87C',secondary:'#73A6A2',trim:'#FFF3D7'},
 'polo-shorts':outfitPalettes.coral, 'aloha-shorts':{primary:'#E8CB82',secondary:'#738E85',trim:'#527F70'},
 overalls:{primary:'#F1DEBF',secondary:'#6A8FA8',trim:'#B16D61'}, 'skirt-tee':{primary:'#9FD3C7',secondary:'#8F94BA',trim:'#FFEFDB'},
 'jersey-dress':{primary:'#B6B1D2',secondary:'#7D789F',trim:'#FFF0C9'}, pirate:{primary:'#CE9690',secondary:'#57596C',trim:'#F5DAB1'},
 'space-suit':{primary:'#BCCDD2',secondary:'#8A9EB6',trim:'#E6B879'}, mix:outfitPalettes.coral,
};
