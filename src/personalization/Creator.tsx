import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { type IslanderLook } from '../islander';
import { Button, Copy, Heading, Sheet } from '../components/ui';
import { useStore } from '../state/Store';
import { activeLearner } from '../learn/learners';
import { canWear } from './catalog';
import { personFor } from './model';
import { StyleEditor } from './StyleEditor';

export function Creator({ onClose }: { onClose: () => void }) {
  const store = useStore(), learner = activeLearner(store.save.learning), person = personFor(store.save);
  const [look, setLook] = useState<IslanderLook>(person.look), [done, setDone] = useState(false);
  const { height } = useWindowDimensions();
  const [expected] = useState({ learner: learner.id, epoch: store.epoch });
  const finish = () => { if (look.presentation && canWear(look, person.earned) && store.personalize({ look, made: true }, expected)) setDone(true); };
  return <Sheet visible presence={false} title={person.made ? 'Change my look' : 'Make your islander'} onClose={onClose} footer={done ? <Button onPress={onClose}>Let’s go</Button> : <View style={{ flexDirection: height < 500 ? 'row' : 'column', gap: 8 }}><View style={{ flex: 1 }}><Button disabled={!look.presentation || !canWear(look, person.earned)} onPress={finish}>Done!</Button></View><View style={{ flex: 1 }}><Button quiet compact onPress={onClose}>{person.made ? 'Keep my look' : 'Make it later'}</Button></View></View>}>
    {done ? <View style={{ gap: 8 }}><Heading>That’s {learner.name}!</Heading><Copy>Your islander is ready for island adventures.</Copy></View> : <StyleEditor creator look={look} equipped={person.look} earned={person.earned} unseen={[]} onChange={setLook}/>}
  </Sheet>;
}
