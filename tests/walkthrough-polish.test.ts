import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { badgeInfo, badgeRule, tracks, type BadgeId } from '../src/badges/engine';
import { thumbnailFocus } from '../src/personalization/thumbnail';
import { styleCatalog } from '../src/personalization/catalog';
import { characterPoint, itemPoint, itemSize } from '../src/home/geometry';
import { socketsOf } from "../src/home/interactions";
import { instance, starterHome } from '../src/home/model';
describe('walkthrough reward clarity', () => {
  for (const track of tracks) for (const tier of [1,2,3,4]) it(`${track}-${tier} names its track and matches documented copy`, () => {
    const id = `${track}-${tier}` as BadgeId, rule = badgeInfo(id).rule;
    expect(rule.toLowerCase()).toContain(track === 'chamoru' ? 'chamoru' : track);
    expect(readFileSync('tests/fixtures/badge-rules.md', 'utf8')).toContain(badgeRule(id));
  });
  it('gives every locked wardrobe item a visible track', () => {
    for (const item of styleCatalog.filter(i => !i.starter)) expect(item.track?.length).toBeGreaterThan(0);
  });
  it('frames wrist, neck and back accessories instead of reusing the head crop', () => {
    const focus = (value: string) => thumbnailFocus({ category: 'accessory', value });
    expect(focus('calculator-watch').box).toBe('39 68 52 52');
    expect(focus('flower-lei').box).toBe('9 43 62 62');
    expect(focus('checker-scarf')).toEqual(focus('flower-lei'));
    expect(focus('backpack').view).toBe('back');
    expect(focus('reading-glasses').box).toBe('5 0 70 70');
  });
  it('aligns the constant-size seated hip to each illustrated surface', () => {
    const home=starterHome();home.rooms.home.instances.push(instance('chair','chair',12,8));
    for(const anchor of ['bed','chair','rug'] as const) {
      const seat=home.rooms.home.instances.find(i=>i.item===anchor)!;
      expect(characterPoint(home.rooms.home,{slot:0,anchor,pose:'sit',seatId:seat.id}).y-itemPoint(seat).y).toBeCloseTo((socketsOf(seat)[0].at[1]-.85)*itemSize(seat), 6);
    }
  });
});

it('frames v3 feet and garments below the large head', () => {
  const box = (category: 'shoes' | 'shoeColor' | 'top' | 'bottom' | 'hairColor' | 'build') => thumbnailFocus({ category, value: '' }).box.split(' ').map(Number);
  for (const category of ['shoes', 'shoeColor'] as const) {
    const [x, y, w, h] = box(category);
    // Both feet (around x=30/50, y=128) and boot cuffs fit, with no head.
    expect(x).toBeLessThan(23); expect(x + w).toBeGreaterThan(57);
    expect(y).toBeGreaterThan(90); expect(y).toBeLessThan(116); expect(y + h).toBeGreaterThan(132);
  }
  expect(box('top')[1]).toBeGreaterThan(60);
  expect(box('bottom')[1]).toBeGreaterThan(80);
  expect(box('hairColor')).toEqual([5, 0, 70, 70]);
  expect(box('build')[3]).toBeGreaterThanOrEqual(132);
});
