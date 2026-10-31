import type { RoomId } from '../catalogMore';
import type { HomeState } from '../model';
/** Initial choices only. Explicit child-selected themes always win. */
export const roomDefaultTheme: Record<RoomId, HomeState['theme']> = {
  home: { wallpaper: 'cream', floor: 'sand' },
  kitchen: { wallpaper: 'lagoon', floor: 'sand' },
  treehouse: { wallpaper: 'cream', floor: 'honey' },
  beach: { wallpaper: 'cream', floor: 'sand' },
};
