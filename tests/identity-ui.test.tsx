import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { StyleGrid } from '../src/personalization/StyleGrid';
import { styleCatalog } from '../src/personalization/catalog';
import { defaultLook } from '../src/islander/look';
vi.mock('react-native-svg', () => ({ default: ({ children }: { children?: React.ReactNode }) => <svg>{children}</svg>, Path: () => <path/>, Rect: () => <rect/>, Defs: ({children}: {children?: React.ReactNode}) => <defs>{children}</defs>, Filter: ({children}: {children?: React.ReactNode}) => <filter>{children}</filter>, FeColorMatrix: () => <feColorMatrix/>, G: ({children}: {children?: React.ReactNode}) => <g>{children}</g> }));
vi.mock('react-native', () => ({ Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>, View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>, useWindowDimensions: () => ({ width: 390, height: 844 }) }));
vi.mock('../src/islander', async () => ({ resolvePose: (await import('../src/islander/rig/poses')).resolvePose, IslanderShape: ({pose}: {pose: {id: string}}) => <g aria-label={`Islander preview ${pose.id}`}/> }));
vi.mock('../src/components/ui', () => ({ C: {}, Copy: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>, PressableScale: ({ children, accessibilityLabel, accessibilityState }: { children?: React.ReactNode; accessibilityLabel?: string; accessibilityState?: { selected?: boolean } }) => <button aria-label={accessibilityLabel} aria-pressed={accessibilityState?.selected}>{children}</button> }));
it('renders an inspectable locked fixture with its earning explanation and New badge', () => {
  const fixture = styleCatalog.map(i => i.id === 'hat:cap' ? { ...i, starter: false, lockedReason: 'Finish a reading round.', track: 'Reading' } : i);
  const markup = renderToStaticMarkup(<StyleGrid category="hat" look={{ ...defaultLook, hat: 'cap' }} equipped={defaultLook} earned={[]} unseen={['hat:cap']} catalog={fixture} onChoose={() => {}}/>);
  expect(markup).toContain('Finish a reading round.'); expect(markup).toContain('Reading'); expect(markup).toContain('New'); expect(markup).toContain('Previewing'); expect(markup).toContain('Wearing');
  // Locked items remain inspectable/previewable rather than disabled mystery tiles.
  expect(markup).not.toContain('disabled');
});

it.each(['outfit', 'hat', 'hairStyle', 'accessory'] as const)('renders supported rig poses for every %s thumbnail, including the rear backpack', category => {
  expect(() => renderToStaticMarkup(<StyleGrid category={category} look={defaultLook} equipped={defaultLook} earned={[]} unseen={[]} onChoose={() => {}}/>)).not.toThrow();
});

it('keeps phone tiles compact while retaining the exact lock rule and preview action', () => {
  const fixture = styleCatalog.filter(i => i.id === 'outfit:number-tee');
  const compact = renderToStaticMarkup(<StyleGrid compact category="outfit" look={defaultLook} equipped={defaultLook} earned={[]} unseen={[]} catalog={fixture} onChoose={() => {}}/>);
  expect(compact).toContain('aria-label="Number-pattern tee, locked. Earn Builder: Finish 3 different math games or levels.');
  expect(compact).toContain('Math');
  expect(compact).not.toContain('disabled');
  // The rule is announced on the tile; selecting it reveals the same full rule above the grid.
  expect(compact.match(/Finish 3 different math games or levels/g)).toHaveLength(1);
  const tablet = renderToStaticMarkup(<StyleGrid category="outfit" look={defaultLook} equipped={defaultLook} earned={[]} unseen={[]} catalog={fixture} onChoose={() => {}}/>);
  expect(tablet.match(/Finish 3 different math games or levels/g)).toHaveLength(1);
});
