import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, C, Copy, Heading, styles } from '../components/ui';
import { Recovery } from '../components/Recovery';
import { LearnerChip } from '../personalization/LearnerChip';
import { personFor } from '../personalization/model';
import { useStore } from '../state/Store';
import { BadgeArt } from '../badges/BadgeArt';
import { BadgeWall } from '../badges/BadgeWall';
import { badgeInfo, badgesFor, progressForBadge, tracks, type BadgeId } from '../badges/engine';
function validBadge(value: unknown): value is BadgeId { return typeof value === 'string' && tracks.some(track => [1,2,3,4].some(tier => value === `${track}-${tier}`)); }
export default function BadgesRoute() {
  const store = useStore();
  if (!store.ready) return <SafeAreaView style={styles.page}><Heading>Opening your badges…</Heading></SafeAreaView>;
  if (store.recovery) return <SafeAreaView style={styles.page}><Recovery/></SafeAreaView>;
  return <MyBadges key={`${store.save.learning?.active ?? 'family'}:${store.epoch}`}/>;
}
function MyBadges() {
  const store = useStore(), person = personFor(store.save), badges = badgesFor(person.milestones), params = useLocalSearchParams<{ badge?: string }>();
  const [selected, setSelected] = useState<BadgeId>(validBadge(params.badge) ? params.badge : 'math-1');
  const info = badgeInfo(selected), earned = badges.includes(selected);
  return <SafeAreaView style={styles.page}>
    <View style={{ padding: 12, gap: 8 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Button quiet compact onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>Back</Button><Heading style={{ fontSize: 25 }}>My badges</Heading><Button quiet compact onPress={() => router.push('/island-home')}>Home</Button></View><LearnerChip compact/></View>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
      <Heading>Little big moments</Heading><Copy>Every finished game is a little discovery. Help and family play count, too.</Copy>
      <View testID="badge-detail" accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 22, backgroundColor: '#F1E7D2', borderColor: '#D4C3A1', borderWidth: 1 }}><BadgeArt id={selected} earned={earned} size={74}/><View style={{ flex: 1, gap: 4 }}><Copy style={{ color: C.muted, fontSize: 13 }}>{earned ? 'Yours to keep' : 'A little adventure ahead'}</Copy><Heading style={{ fontSize: 22 }}>{info.name}</Heading><Copy style={{ fontSize: 15 }}>{info.rule}</Copy><Copy style={{ fontSize: 14, color: C.muted }}>{earned ? 'Earned · Always yours' : progressForBadge(selected, person.milestones)}</Copy></View></View>
      <BadgeWall badges={badges} milestones={person.milestones} selected={selected} onSelect={setSelected}/>
    </ScrollView>
  </SafeAreaView>;
}
