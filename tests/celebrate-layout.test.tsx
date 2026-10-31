import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Celebrate } from '../src/learn/Celebrate';
vi.mock('../src/components/motion', () => ({ useReducedMotion: () => false, easeOut: undefined, nativeDriver: false }));
vi.mock('react-native', () => {
  const View = ({ children, style, testID }: { children?: React.ReactNode; style?: React.CSSProperties; testID?: string }) => <div data-testid={testID} style={style}>{children}</div>;
  return { View, Animated: { View, Value: class { interpolate() { return 1; } } } };
});
vi.mock('react-native-svg', () => ({ default: ({ children, width, height }: { children?: React.ReactNode; width: number; height: number }) => <svg width={width} height={height}>{children}</svg>, Circle: () => <circle/>, Path: () => <path/> }));
describe('celebration owns its paint space', () => {
  it.each([false, true])('clips every animation frame inside an in-flow cell (big=%s)', big => {
    const html = renderToStaticMarkup(<Celebrate burst={1} big={big}/>);
    const root = html.slice(0, html.indexOf('>') + 1);
    expect(root).toContain('data-testid="celebration-cell"');
    expect(root).toContain('overflow:hidden');
    expect(root).toContain(`height:${big ? 88 : 64}px`);
    expect(root).not.toContain('position:absolute');
    expect(html).toContain(`width="${big ? 56 : 40}"`);
  });
  it('does not reserve space before the first feedback event', () => {
    expect(renderToStaticMarkup(<Celebrate burst={0}/>)).toBe('');
  });
});
