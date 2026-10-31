import { grantCatalog, MAX_MILESTONES, validMilestone } from '../badges/engine';
import { themeRewards } from '../home/catalog';
import { owns } from '../home/model';
import { canWear } from './catalog';
import { defaultLook, isValidLook, type IslanderLook } from '../islander/look';
import { starterHome, validHome, migrateHome, type HomeSave } from '../home/model';
import { familyLearners, type Learners } from '../learn/learners';
import type { Save } from '../state/validation';
export type Person = { look: IslanderLook; made: boolean; earned: string[]; milestones: string[]; unseen: string[]; home: HomeSave };
export type Personalization = { version: 1; catalogVersion: 1; people: Record<string, Person> };
export type IdentityExpected = { learner: string; epoch: number };
export const starterPerson = (family = false): Person => ({ look: { ...defaultLook }, made: family, earned: [], milestones: [], unseen: [], home: starterHome() });
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const ids = (v: unknown): v is string[] => Array.isArray(v) && v.length <= MAX_MILESTONES && new Set(v).size === v.length && v.every(id => typeof id === 'string' && /^[a-z0-9][a-z0-9:._-]{0,95}$/.test(id));
export function validPerson(v: unknown, stickers: readonly string[] = []): v is Person {
  return object(v) && exact(v, ['look', 'made', 'earned', 'milestones', 'unseen', 'home']) && isValidLook(v.look) && typeof v.made === 'boolean' && ids(v.earned) && ids(v.milestones) && ids(v.unseen) && v.unseen.every(id => (v.earned as string[]).includes(id)) && validHome(v.home)
    && v.earned.every(id => grantCatalog().includes(id)) && v.milestones.every(validMilestone)
    && canWear(v.look, v.earned) && entitledHome(v.home, v.earned, stickers);
}
export function entitledHome(home: HomeSave, earned: readonly string[], stickers: readonly string[] = []): boolean {
  const migrated = migrateHome(home);
  if (!migrated) return false;
  return Object.values(migrated.rooms).every(room => room.instances.every(i => owns(i.item, { ownedItems: [...earned, ...stickers.map(id => `sticker:${id}`)] as import('../home/catalog').ItemId[] }))
    && Object.values(room.theme).every(id => !themeRewards.some(r => r.id === id) || earned.includes(id)));
}
export function validPersonalization(v: unknown, learners?: Learners, arcade?: Save["arcade"]): v is Personalization {
  const owners = (learners ?? familyLearners()).people.map(p => p.id);
  return object(v) && exact(v, ['version', 'catalogVersion', 'people']) && v.version === 1 && v.catalogVersion === 1 && object(v.people) && Object.keys(v.people).length <= 5 && Object.entries(v.people).every(([id, p]) => owners.includes(id) && validPerson(p, arcade?.people[id]?.stickers));
}
/** Lazy, idempotent migration. Only called after the envelope has been validated. */
export function initializePersonalization(save: Save): Save {
  const people = { ...save.personalization?.people };
  let changed = !save.personalization;
  for (const { id } of (save.learning ?? familyLearners()).people) if (!Object.hasOwn(people, id)) { people[id] = starterPerson(id === 'family'); changed = true; }
  for (const [id, person] of Object.entries(people)) {
    const home = migrateHome(person.home);
    if(!home)throw new Error('This home could not be migrated. Your original has been kept.');
    if (home !== person.home) { people[id] = { ...person, home }; changed = true; }
  }
  return changed ? { ...save, personalization: { version: 1, catalogVersion: 1, people } } : save;
}
export function personFor(save: Save, owner = save.learning?.active ?? 'family'): Person {
  const people = save.personalization?.people;
  return people && Object.hasOwn(people, owner) ? people[owner] : starterPerson(owner === 'family');
}
export function applyPersonalization(save: Save, patch: Partial<Pick<Person, 'look' | 'made' | 'home' | 'unseen'>>, expected: IdentityExpected, epoch: number): Save {
  if (Object.keys(patch).some(key => !['look','made','home','unseen'].includes(key))) return save;
  if (expected.epoch !== epoch || expected.learner !== (save.learning?.active ?? 'family')) return save;
  const initialized = initializePersonalization(save), p = personFor(initialized, expected.learner), next = { ...p, ...patch };
  if (!validPerson(next, save.arcade?.people[expected.learner]?.stickers) || patch.look && !canWear(patch.look, p.earned)) return save;
  // A valid explicit save is acknowledged even when the look is unchanged (creator finish).
  return { ...initialized, personalization: { ...initialized.personalization!, people: { ...initialized.personalization!.people, [expected.learner]: next } } };
}
/** Delete only records owned by this learner. The Store preserves the full prior save first. */
export function withoutLearner(save: Save, id: string): Save {
  const learning = save.learning;
  if (id === 'family' || !learning?.people.some(p => p.id === id)) return save;
  const people = learning.people.filter(p => p.id !== id);
  const next: Save = { ...save, learning: { active: learning.active === id ? 'family' : learning.active, people } };
  if (save.personalization) next.personalization = { ...save.personalization, people: Object.fromEntries(Object.entries(save.personalization.people).filter(([owner]) => owner !== id)) };
  if (save.roundOwners) {
    const owned = (prefix: string, game: string) => save.roundOwners!.rounds[`${prefix}:${game}`]?.owner === id;
    next.sessions = Object.fromEntries(Object.entries(save.sessions).filter(([game])=>!owned('classic',game)));
    if (save.board) next.board = Object.fromEntries(Object.entries(save.board).filter(([game])=>!owned('board',game)));
    if (save.activities) next.activities = Object.fromEntries(Object.entries(save.activities).filter(([game])=>!owned('activity',game)));
    if (Object.entries(save.roundOwners.rounds).some(([key,r])=>key.startsWith('explore:') && r.owner === id) && save.explore) next.explore = { favorites: save.explore.favorites };
  }
  if (save.roundOwners) next.roundOwners = { ...save.roundOwners, rounds: Object.fromEntries(Object.entries(save.roundOwners.rounds).filter(([,r])=>r.owner !== id)) };
  if (save.arcade) next.arcade = { ...save.arcade, people: Object.fromEntries(Object.entries(save.arcade.people).filter(([owner]) => owner !== id)) };
  if (save.learn) next.learn = Object.fromEntries(Object.entries(save.learn).filter(([, round]) => (round.learner ?? 'family') !== id));
  return next;
}
