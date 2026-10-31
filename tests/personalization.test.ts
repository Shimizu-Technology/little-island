import { milestoneCatalog, grantCatalog } from '../src/badges/engine';
import { describe, expect, it } from 'vitest';
import { emptySave, parseSave, type Save } from '../src/state/validation';
import { addLearner } from '../src/learn/learners';
import { emptyArcade, arcadeLearner, arcadeTransition } from '../src/arcade/progress';
import { applyPersonalization, initializePersonalization, personFor, starterPerson, validPersonalization, withoutLearner } from '../src/personalization/model';
import { canWear, lockedReason, styleCatalog } from '../src/personalization/catalog';
import { preserveAndReplace } from '../src/state/replacement';
import { starterHome } from '../src/home/model';
import { startSession } from '../src/learn/session';
const withLearner = (): Save => ({ ...emptySave(), learning: addLearner(undefined, 'Mina', 'mina') });
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const encode = (v: unknown) => JSON.stringify(v);
describe('personalization save boundary', () => {
  it('leaves legacy saves unchanged until lazy idempotent initialization', () => {
    const legacy = withLearner();
    legacy.arcade = { ...emptyArcade(), people: { mina: arcadeLearner(undefined, 'mina') } };
    for (let i = 1; i <= 4; i++) legacy.arcade = arcadeTransition(legacy.arcade, 'mina', { type: 'finish', game: 'lagoon-run', level: `w1-${i}` as 'w1-1', round: `old-${i}`, stars: 3, score: 100, name: 'Mina' });
    legacy.arcade = arcadeTransition(legacy.arcade, 'mina', { type: 'outfit', game: 'lagoon-run', outfit: 'sunhat' });
    legacy.arcade.people.mina.stickers = ['reef-fish'];
    const before = clone(legacy), loaded = parseSave(encode(legacy));
    expect(loaded.personalization).toBeUndefined();
    const migrated = initializePersonalization(loaded);
    expect(legacy).toEqual(before);
    expect(migrated.version).toBe(1);
    expect(migrated.arcade).toEqual(before.arcade);
    expect(personFor(migrated).made).toBe(false);
    expect(personFor(migrated, 'family').made).toBe(true);
    expect(initializePersonalization(migrated)).toBe(migrated);
  });
  it('treats an absent dictionary entry as a starter even for a prototype-like owner ID', () => {
    const save: Save = { ...emptySave(), learning: addLearner(undefined, 'Cora', 'constructor'), personalization: { version: 1, catalogVersion: 1, people: {} } };
    expect(personFor(save)).toEqual(starterPerson());
    expect(personFor(initializePersonalization(save))).toEqual(starterPerson());
  });
  it('round-trips distinct looks, room, unseen and milestones in backups', () => {
    const save = initializePersonalization(withLearner());
    const p = save.personalization!.people.mina;
    p.look = { ...p.look, hairStyle: 'braids', hat: 'cap' };
    p.earned = ['hat:bookworm-beanie']; p.unseen = ['hat:bookworm-beanie']; p.milestones = ['learn:sound-boat:1'];
    (p.home as import("../src/home/model").HomeStateV2).rooms.home.characters[0] = { slot: 0, anchor: 'floor', pose: 'stand', x: 1, y: 2 };
    expect(parseSave(encode(save))).toEqual(save);
    expect(personFor(save, 'family').look.hat).toBe('none');
  });
  it.each([
    (p: any) => { p.version = 2; },
    (p: any) => { p.catalogVersion = 2; },
    (p: any) => { p.extra = true; },
    (p: any) => { p.people.stranger = starterPerson(); },
    (p: any) => { p.people.family.made = 1; },
    (p: any) => { p.people.family.look.hat = 'unknown'; },
    (p: any) => { p.people.family.home.rooms.home.characters[0].x = NaN; },
    (p: any) => { p.people.family.unseen = ['hat:cap']; },
    (p: any) => { p.people.family.earned = ['hat:cap', 'hat:cap']; },
    (p: any) => { p.people.family.milestones = ['bad id']; },
    (p: any) => { p.people.family.home.history = []; },
    (p: any) => { p.people.family.look.extra = true; },
  ])('rejects malformed namespaces without changing input %#', mutate => {
    const p = clone(initializePersonalization(emptySave()).personalization!); mutate(p);
    const raw = encode({ ...emptySave(), personalization: p });
    expect(() => parseSave(raw)).toThrow(); expect(encode({ ...emptySave(), personalization: p })).toBe(raw);
  });
  it('enforces owner and catalog caps, including duplicate milestones', () => {
    const save = initializePersonalization(withLearner()), p = save.personalization!;
    p.people.mina.earned = grantCatalog();
    p.people.mina.milestones = [...milestoneCatalog];
    expect(validPersonalization(p, save.learning)).toBe(true);
    p.people.mina.earned.push('too-many'); expect(validPersonalization(p, save.learning)).toBe(false);
    p.people.mina.earned.pop(); p.people.mina.milestones.push('too-many'); expect(validPersonalization(p, save.learning)).toBe(false);
    p.people.mina.milestones = ['same', 'same']; expect(validPersonalization(p, save.learning)).toBe(false);
    for (let i = 0; i < 6; i++) p.people[`extra-${i}`] = starterPerson();
    expect(validPersonalization(p, save.learning)).toBe(false);
  });
  it('acknowledges finishing an existing islander without changing their look', () => {
    const save = initializePersonalization(emptySave());
    const accepted = applyPersonalization(save, { look: personFor(save).look, made: true }, { learner: 'family', epoch: 1 }, 1);
    expect(accepted).not.toBe(save);
    expect(accepted).toEqual(save);
    expect(parseSave(encode(accepted))).toEqual(save);
  });
  it('rejects stale learner/restore edits and invalid home writes', () => {
    const save = withLearner(), expected = { learner: 'mina', epoch: 3 };
    expect(applyPersonalization(save, { made: true }, expected, 4)).toBe(save);
    expect(applyPersonalization(save, { made: true }, { ...expected, learner: 'family' }, 3)).toBe(save);
    expect(applyPersonalization(save, { home: { ...starterHome(), version: 4 } as any }, expected, 3)).toBe(save);
    const next = applyPersonalization(save, { made: true }, expected, 3);
    expect(personFor(next).made).toBe(true); expect(personFor(save).made).toBe(false);
  });
  it('removes only owned data, keeps Family, and restores from a preserved snapshot', async () => {
    const save = initializePersonalization(withLearner());
    const round = startSession('shell-math', { options: { mode: 'solo', pace: 'easy' } }, undefined); round.learner = 'mina';
    save.learn = { 'shell-math': round }; save.arcade = { ...emptyArcade(), people: { mina: arcadeLearner(undefined, 'mina'), family: arcadeLearner(undefined, 'family') } };
    expect(withoutLearner(save, 'family')).toBe(save);
    const next = withoutLearner(save, 'mina');
    expect(next.learning?.active).toBe('family'); expect(next.learn).toEqual({});
    expect(next.personalization?.people.mina).toBeUndefined(); expect(next.arcade?.people.mina).toBeUndefined();
    expect(parseSave(encode(next))).toEqual(next);
    let value = encode(save); const preserved: string[] = [];
    await preserveAndReplace({ get: async () => value, set: async s => { value = s; }, preserve: async s => { preserved.push(s); }, listRecovery: async () => [], readRecovery: async () => null }, encode(next), encode(save));
    expect(parseSave(preserved[0])).toEqual(save);
  });
  it('preserves malformed personalization bytes before a fresh start', async () => {
    let value = encode({ ...emptySave(), personalization: { version: 999 } }); const original = value, preserved: string[] = [];
    expect(() => parseSave(value)).toThrow();
    await preserveAndReplace({ get: async () => value, set: async s => { value = s; }, preserve: async s => { preserved.push(s); }, listRecovery: async () => [], readRecovery: async () => null }, encode(emptySave()), null);
    expect(preserved).toEqual([original]); expect(parseSave(value)).toEqual(emptySave());
  });
});
describe('Locker entitlement seam', () => {
  it('keeps starters free and previews a locked fixture without wearing it', () => {
    const p = starterPerson(); expect(canWear(p.look, [])).toBe(true);
    expect(styleCatalog.filter(i => !i.starter)).toHaveLength(21);
    expect(styleCatalog.filter(i => !i.starter).every(i => !!lockedReason(i, []))).toBe(true);
    const fixture = styleCatalog.map(i => i.id === 'hat:cap' ? { ...i, starter: false, lockedReason: 'Finish a reading round.' } : i);
    const cap = fixture.find(i => i.id === 'hat:cap')!;
    expect(lockedReason(cap, [])).toBe('Finish a reading round.');
    const preview = { ...p.look, hat: 'cap' as const };
    expect(canWear(preview, [], fixture)).toBe(false); expect(p.look.hat).toBe('none');
    expect(canWear(preview, ['hat:cap'], fixture)).toBe(true);
  });
});
