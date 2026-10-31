import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { companionPose, resultEvent, showLearningCompanion, classicEvent, learnerPortraitOwner } from '../src/islander/reactions';
import { emptySave, parseSave } from '../src/state/validation';
import { createGame } from '../src/games';
import { defaultOptions } from '../src/games/types';
import { defaultLook } from '../src/islander/look';
import { Companion, IslanderPortrait, LearningCompanion, PhoneLearningCompanion } from '../src/islander/Companion';
const fixture = vi.hoisted(() => ({ settings: {} as { learningIslander?: boolean }, width: 390, reduced: false }));
vi.mock('../src/state/Store', () => ({ useStore: () => ({ save: { settings: fixture.settings } }) }));
vi.mock('../src/islander/active', () => ({ useActiveIslanderLook: () => ({ skin: 'sand', hairStyle: 'curls', hairColor: 'black', outfit: 'island', hat: 'none', accessory: 'none' }) }));
vi.mock('../src/components/motion', () => ({ useReducedMotion: () => fixture.reduced }));
vi.mock('react-native', () => ({ View: ({ children, testID }: { children?: React.ReactNode; testID?: string }) => <div data-testid={testID}>{children}</div>, useWindowDimensions: () => ({ width: fixture.width, height: 844 }) }));
vi.mock('../src/islander/rig/Islander', () => ({ Islander: ({ pose, size, look }: { pose?: string; size?: number; look?: { outfit: string } }) => <svg data-pose={pose} data-size={size} data-outfit={look?.outfit}/>, IslanderDesk: () => <svg data-desk="true"/> }));

describe('companion accepted engine event presentation', () => {
  it('maps entry, waiting, success, gentle retry, draw and dance frames', () => {
    expect(companionPose('entry')).toBe('wave');
    expect(companionPose('waiting')).toBe('think');
    expect(companionPose('waiting', true)).toBe('desk-write');
    for (const event of ['correct', 'win'] as const) expect(companionPose(event)).toBe('cheer');
    for (const event of ['incorrect', 'loss'] as const) expect(companionPose(event)).toBe('try-again');
    expect(companionPose('draw')).toBe('clap');
    expect([0, 1, 2, 3, 4].map(f => companionPose('complete', false, f))).toEqual(['dance-0', 'dance-1', 'dance-2', 'dance-3', 'dance-0']);
  });
  it('does not celebrate a solo loss; family seats both count as wins', () => {
    expect(resultEvent(0, true)).toBe('win');
    expect(resultEvent(1, true)).toBe('loss');
    expect(resultEvent(1, false)).toBe('win');
    expect(resultEvent('draw', true)).toBe('draw');
    const tic = createGame('tic-tac-toe', defaultOptions);
    if (tic.game !== 'tic-tac-toe') throw Error('fixture');
    expect(classicEvent({ ...tic, board: ['O', 'O', 'O', 'X', 'X', null, null, null, null] })).toBe('loss');
  });
  it('resolves You, named family learners and ambiguous names while protecting computer seats', () => {
    const people = [{ id: 'a', name: 'Mina' }, { id: 'b', name: 'Computer' }];
    expect(learnerPortraitOwner('You', people, 'a')).toBe('a');
    expect(learnerPortraitOwner('mina', people, 'b')).toBe('a');
    expect(learnerPortraitOwner('Computer', people, 'a')).toBe('b');
    expect(learnerPortraitOwner('Computer', people, 'a', true)).toBeNull();
    expect(learnerPortraitOwner('Visitor', people, 'a')).toBeNull();
    expect(learnerPortraitOwner('Mina', [...people, { id: 'c', name: 'Mina' }], 'a')).toBeNull();
  });
  it('defaults on, round-trips explicit off, rejects malformed settings and leaves old saves unchanged', () => {
    const old = emptySave();
    expect(showLearningCompanion(old.settings)).toBe(true);
    expect(parseSave(JSON.stringify(old))).toEqual(old);
    const off = { ...old, settings: { ...old.settings, learningIslander: false } };
    expect(showLearningCompanion(parseSave(JSON.stringify(off)).settings)).toBe(false);
    expect(() => parseSave(JSON.stringify({ ...old, settings: { ...old.settings, learningIslander: 'false' } }))).toThrow();
  });
});
describe('placement render smoke', () => {
  it.each(['entry', 'waiting', 'correct', 'incorrect', 'complete', 'win', 'loss', 'draw'] as const)('renders %s without a control or overlay', event => {
    const html = renderToStaticMarkup(<Companion event={event}/>);
    expect(html).toContain(`data-pose="${companionPose(event)}"`);
    expect(html).not.toContain('<button');
  });
  it.each([390, 844, 1024, 768])('keeps the activity when hidden and scales beside it at width %i', width => {
    fixture.width = width; fixture.settings = {};
    const html = renderToStaticMarkup(<LearningCompanion event="waiting" desk><button>Answer</button></LearningCompanion>);
    expect(html).toContain('Answer');
    if (width < 600) expect(html).not.toContain('data-size');
    else { expect(html).toContain('data-desk="true"'); expect(html).toContain(`data-size="${width >= 768 ? 168 : 112}"`); }
    fixture.settings = { learningIslander: false };
    expect(renderToStaticMarkup(<LearningCompanion event="waiting"><button>Answer</button></LearningCompanion>)).toBe('<button>Answer</button>');
    fixture.settings = {};
  });
  it.each(['waiting', 'correct', 'incorrect'] as const)('keeps the phone header crop reacting to %s', event => {
    fixture.settings = {};
    const html = renderToStaticMarkup(<PhoneLearningCompanion event={event} active/>);
    expect(html).toContain('phone-learning-companion');
    expect(html).toContain(`data-pose="${companionPose(event)}"`);
    expect(html).toContain('data-size="106"');
    fixture.settings = { learningIslander: false };
    expect(renderToStaticMarkup(<PhoneLearningCompanion event={event} active/>)).toBe('');
    fixture.settings = {};
  });
  it('uses the supplied learner look for family portraits', () => {
    expect(renderToStaticMarkup(<IslanderPortrait look={{ ...defaultLook, outfit: 'explorer' }}/>)).toContain('data-outfit="explorer"');
  });
  it('renders a static dance under Reduce Motion', () => {
    fixture.reduced = true;
    expect(renderToStaticMarkup(<Companion event="complete"/>)).toContain('data-pose="dance-0"');
    fixture.reduced = false;
  });
});
