import React, { useState } from 'react';
import { View } from 'react-native';
import { Islander } from '../islander';
import { activeLearner, familyLearners } from '../learn/learners';
import { useStore } from '../state/Store';
import { C, Copy, Heading, PressableScale, Sheet } from '../components/ui';
import { Portrait } from './Portrait';
import { personFor } from './model';
export function LearnerChip({ compact = false }: { compact?: boolean }) {
  const store = useStore(), learner = activeLearner(store.save.learning), [open, setOpen] = useState(false);
  return <>
    <PressableScale accessibilityRole="button" accessibilityLabel={`Who is playing: ${learner.name}. Switch learner`} onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 3, backgroundColor: C.soft, borderRadius: 24, maxWidth: '100%' }}>
      <Portrait look={personFor(store.save).look} size={compact ? 36 : 44}/>
      <Copy style={{ fontSize: compact ? 13 : 16, flexShrink: 1 }}>{learner.name} ▾</Copy>
    </PressableScale>
    <Sheet visible={open} title="Who is playing?" onClose={() => setOpen(false)}>
      <Copy>Pick your islander. Your place here stays open.</Copy>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{(store.save.learning ?? familyLearners()).people.map(p => <PressableScale key={p.id} accessibilityRole="button" accessibilityLabel={`Play as ${p.name}`} accessibilityState={{ selected: p.id === learner.id }} onPress={() => { store.selectLearner(p.id); setOpen(false); }} style={{ alignItems: 'center', width: 140, padding: 12, borderRadius: 20, backgroundColor: p.id === learner.id ? C.soft : C.cream, borderWidth: 2, borderColor: p.id === learner.id ? C.teal : C.line }}>
        <Islander view="front" pose="idle" look={personFor(store.save, p.id).look} size={100}/><Heading style={{ fontSize: 17, textAlign: 'center' }}>{p.name}</Heading>{p.id === learner.id && <Copy>Playing now</Copy>}
      </PressableScale>)}</View><Copy>A grown-up can add or change learners in Settings.</Copy>
    </Sheet>
  </>;
}
