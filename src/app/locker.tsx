import React, { useEffect, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { type IslanderLook } from '../islander';
import { Button, C, Copy, Heading, styles } from '../components/ui';
import { Recovery } from '../components/Recovery';
import { SaveStatus } from '../components/SaveStatus';
import { useStore } from '../state/Store';
import { LearnerChip } from '../personalization/LearnerChip';
import { personFor } from '../personalization/model';
import { lookWithStyle, canWear, styleCatalog } from '../personalization/catalog';
import { StyleEditor } from '../personalization/StyleEditor';

export default function LockerRoute() {
  const store = useStore();
  if (!store.ready) return <SafeAreaView style={styles.page}><Heading>Opening your Locker…</Heading></SafeAreaView>;
  if (store.recovery) return <SafeAreaView style={styles.page}><Recovery/></SafeAreaView>;
  return <Locker key={`${store.save.learning?.active ?? 'family'}:${store.epoch}`}/>;
}
function Locker() {
  const params = useLocalSearchParams<{ item?: string }>(), initialItem = styleCatalog.find(i => i.id === params.item);
  const store = useStore(), person = personFor(store.save), { height } = useWindowDimensions();
  const [look, setLook] = useState<IslanderLook>(initialItem ? lookWithStyle(person.look, initialItem) : person.look);
  const [message, setMessage] = useState('');
  const [expected] = useState({ learner: store.save.learning?.active ?? 'family', epoch: store.epoch });
  const acknowledge = store.personalize;
  useEffect(() => {
    if (initialItem && person.unseen.includes(initialItem.id)) acknowledge({ unseen: person.unseen.filter(id => id !== initialItem.id) }, expected);
  }, [initialItem, person.unseen, acknowledge, expected]);
  const changed = JSON.stringify(look) !== JSON.stringify(person.look);
  const initialTab = initialItem?.category ?? (person.made ? 'outfit' : 'presentation');
  return <SafeAreaView style={styles.page}>
    <View style={{ paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Button quiet compact onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>Back</Button><Heading style={{ fontSize: 21, flex: 1 }}>My Locker</Heading><LearnerChip compact/></View>
    <ScrollView scrollEnabled={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 10, gap: 8 }}>
      <StyleEditor initialTab={initialTab} initialItem={initialItem} look={look} equipped={person.look} earned={person.earned} unseen={person.unseen} onChange={next => { setLook(next); setMessage(''); }} onSeen={id => { if (person.unseen.includes(id)) store.personalize({ unseen: person.unseen.filter(item => item !== id) }, expected); }} onBadges={() => router.push('/badges')}/>
      {!!person.unseen.length && <Button quiet compact onPress={() => store.personalize({ unseen: [] }, expected)}>Mark all seen</Button>}
    </ScrollView>
    <View testID="locker-save-bar" style={{ padding: height < 500 ? 5 : 8, borderTopWidth: 1, borderColor: C.line, backgroundColor: C.cream, gap: 3 }}><Copy style={{ textAlign: 'center', fontSize: 13 }}>{message || (changed ? 'Trying it on · Wear this to keep it' : 'You’re wearing this')}</Copy><Button compact disabled={!changed || !canWear(look, person.earned)} onPress={() => { if (store.personalize({ look, made: true }, expected)) setMessage('Wearing your new look.'); }}>Wear this</Button><SaveStatus/></View>
  </SafeAreaView>;
}
