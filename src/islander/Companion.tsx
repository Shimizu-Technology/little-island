import React, { useCallback, useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from '../components/motion';
import { useStore } from '../state/Store';
import { Islander, IslanderDesk } from './rig/Islander';
import { useActiveIslanderLook } from './active';
import { companionPose, showLearningCompanion, type CompanionEvent } from './reactions';
import type { IslanderLook } from './look';

/** Static memoized rig frames, swapped at a low cadence; never holds input or speech. */
export function Companion({ event = 'waiting', desk = false, size = 88, active = true, look: suppliedLook }: {
  event?: CompanionEvent; desk?: boolean; size?: number; active?: boolean; look?: IslanderLook;
}) {
  const activeLook = useActiveIslanderLook(), reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (event !== 'complete' || reduced || !active) return;
    const timer = setInterval(() => setFrame(f => (f + 1) % 4), 360);
    return () => clearInterval(timer);
  }, [event, reduced, active]);
  const pose = companionPose(event, desk, reduced || !active ? 0 : frame);
  return <View testID={`islander-${event}`} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: size * 80 / 132, height: size, flexShrink: 0 }}>
    {event === 'complete' && !reduced && active ? [0, 1, 2, 3].map(i =>
      <View key={i} style={{ position: 'absolute', top: 0, left: 0, opacity: frame === i ? 1 : 0 }}>
        <Islander look={suppliedLook ?? activeLook} pose={`dance-${i}`} size={size}/>
      </View>
    ) : <Islander look={suppliedLook ?? activeLook} pose={pose} size={size}/>}
    {pose === 'desk-write' && <View style={{ position: 'absolute', top: 0, left: 0 }}><IslanderDesk size={size}/></View>}
  </View>;
}
/** Phone header crop keeps the head, hands and torso visible while feedback changes. */
export function PhoneLearningCompanion({ event, active }: { event: CompanionEvent; active: boolean }) {
  const store = useStore();
  if (!showLearningCompanion(store.save.settings)) return null;
  return <View testID="phone-learning-companion" pointerEvents="none" style={{ width: 64, height: 64, overflow: 'hidden', flexShrink: 0 }}>
    <View style={{ position: 'absolute', top: -4, left: 0 }}><Companion event={event} active={active} size={106}/></View>
  </View>;
}
/** Fixed layout space beside the activity on tablets; phones use the header. */
export function LearningCompanion({ children, event, desk, active = true, visible = true, cheer }: {
  children: React.ReactNode; event: CompanionEvent; desk?: boolean; active?: boolean; visible?: boolean; cheer?: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions(), store = useStore();
  if (width < 600 || !visible || !showLearningCompanion(store.save.settings)) return <>{children}</>;
  const wide = width >= 768 && height >= 600;
  return <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-start' : 'stretch', gap: 8 }}>
    <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>{children}</View>
    <View style={{ alignSelf: wide ? 'center' : 'flex-end', alignItems: 'center' }}>
      {cheer}
      <Companion event={event} desk={desk} size={wide ? 168 : 112} active={active}/>
    </View>
  </View>;
}
/** Entry and feedback are temporary. New rounds/learners retire every pending reaction. */
export function useCompanionReaction(identity: string, active: boolean) {
  const [reaction, setReaction] = useState<{ identity: string; event: CompanionEvent; serial: number }>({ identity, event: 'entry', serial: 0 });
  const event = reaction.identity === identity ? reaction.event : 'entry';
  useEffect(() => {
    if (!active || event === 'waiting') return;
    const timer = setTimeout(() => setReaction(r => ({ identity, event: 'waiting', serial: r.serial })), event === 'entry' ? 850 : 1200);
    return () => clearTimeout(timer);
  }, [identity, active, event, reaction.serial]);
  const react = useCallback((next: CompanionEvent) => {
    if (active) setReaction(r => ({ identity, event: next, serial: r.serial + 1 }));
  }, [identity, active]);
  return { event, react };
}
export function IslanderPortrait({ look, size = 36 }: { look: IslanderLook; size?: number }) {
  return <View testID="islander-portrait" pointerEvents="none" style={{ width: size, height: size, overflow: 'hidden', borderRadius: size / 2, backgroundColor: '#F7DFB0', flexShrink: 0 }}>
    <View style={{ position: 'absolute', top: -size * .05, left: -size * .015 }}><Islander look={look} size={size * 1.7}/></View>
  </View>;
}
