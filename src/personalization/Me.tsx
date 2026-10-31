import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { Islander } from '../islander';
import { Button, Heading } from '../components/ui';
import { useStore } from '../state/Store';
import { activeLearner } from '../learn/learners';
import { personFor } from './model';
import { LearnerChip } from './LearnerChip';
import { Creator } from './Creator';
import { useSheetsClear } from '../components/sheetPresence';
export function Me({ creatorAllowed = true }: { creatorAllowed?: boolean }) {
  const focused = useIsFocused();
  const store = useStore(), p = personFor(store.save), learner = activeLearner(store.save.learning);
  return <MeForLearner key={`${learner.id}:${store.epoch}`} made={p.made} creatorAllowed={creatorAllowed && focused}/>;
}
function MeForLearner({ made, creatorAllowed }: { made: boolean; creatorAllowed: boolean }) {
  const store = useStore(), p = personFor(store.save), learner = activeLearner(store.save.learning);
  const [creator, setCreator] = useState(!made), [wave, setWave] = useState(true), clear = useSheetsClear();
  useEffect(() => { const timer = setTimeout(() => setWave(false), 1400); return () => clearTimeout(timer); }, []);
  return <View style={{ backgroundColor: '#F1E8D4', borderRadius: 24, padding: 16, gap: 12 }}>
    <LearnerChip/>
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}><Islander view="front" pose={wave ? 'wave' : 'idle'} look={p.look} size={140}/><View style={{ flex: 1, gap: 10 }}><Heading style={{ fontSize: 24 }}>{learner.id === 'family' ? 'Our island' : `${learner.name}’s island`}</Heading><Button compact onPress={() => router.push('/locker')}>My Locker</Button><Button compact quiet onPress={() => router.push('/island-home')}>Island Home</Button><Button compact quiet onPress={() => router.push('/badges')}>Badges</Button></View></View>
    {!p.made && <Button quiet compact onPress={() => setCreator(true)}>Make your islander</Button>}
    {creator && creatorAllowed && clear && <Creator onClose={() => setCreator(false)}/>}
  </View>;
}
