import { useStore } from '../state/Store';
import { personFor } from '../personalization/model';
import type { IslanderLook } from './look';
/** The active learner's saved Islander look; the single source for in-game appearances. */
export function useActiveIslanderLook(): IslanderLook {
  return personFor(useStore().save).look;
}
