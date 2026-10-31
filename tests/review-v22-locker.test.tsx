import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
const { Pass } = vi.hoisted(() => ({ Pass: ({ children }: { children?: unknown }) => children as never }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, ScrollView: Pass, View: Pass, useWindowDimensions: () => ({ width: 390, height: 844 }) }));
vi.mock('react-native-svg', () => ({ default: Pass, Circle: () => null, Path: () => null, Rect: () => null }));
vi.mock('../src/islander', async () => ({ Islander: () => null, presentationPresets: (await import('../src/islander/look')).presentationPresets }));
vi.mock('../src/components/ui', () => ({ C: {}, Copy: Pass, Heading: Pass, PressableScale: Pass }));
vi.mock('../src/components/Icon', () => ({ Icon: () => null }));
vi.mock('../src/personalization/StyleGrid', () => ({ StyleGrid: () => null }));
vi.mock('../src/personalization/LockBadge', () => ({ LockRule: ({ children }: { children?: React.ReactNode }) => <p data-lock-rule>{children}</p> }));
import { StyleEditor } from '../src/personalization/StyleEditor';
import { lockedReason, styleCatalog } from '../src/personalization/catalog';
import { defaultLook } from '../src/islander/look';

it('shows the earning rule immediately when the Locker opens on a locked item', () => {
  const locked = styleCatalog.find(i => !i.starter && lockedReason(i, []));
  expect(locked).toBeDefined();
  const markup = renderToStaticMarkup(<StyleEditor look={defaultLook} equipped={defaultLook} earned={[]} unseen={[]} onChange={() => {}} onSeen={() => {}} initialTab={locked!.category} initialItem={locked}/>);
  expect(markup).toContain('data-lock-rule');
  expect(markup).toContain(lockedReason(locked!, [])!.replace(/&/g, '&amp;'));
});
