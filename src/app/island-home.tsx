import { useLocalSearchParams } from 'expo-router';
import { badgesFor } from '../badges/engine';
import { furnitureIds, wallThemes, floorThemes, type ItemId } from '../home/catalog';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { homeCharacterPose } from '../home/characterPose';
import { HomeScreen } from '../home/HomeScreen';
import { Islander } from '../islander';
import { useStore } from '../state/Store';
import { personFor } from '../personalization/model';
import { Copy, styles } from '../components/ui';
import { SaveStatus } from '../components/SaveStatus';
import { Recovery } from '../components/Recovery';
import { arcadeLearner } from '../arcade/progress';
import { homeStickerItems } from '../home/catalog';
export default function IslandHomeRoute() {
  const params = useLocalSearchParams<{item?:string}>();
  const store = useStore(), owner = store.save.learning?.active ?? 'family', person = personFor(store.save);
  if (!store.ready) return <SafeAreaView style={styles.page}><Copy>Opening your home…</Copy></SafeAreaView>;
  if (store.recovery) return <SafeAreaView style={styles.page}><Recovery/></SafeAreaView>;
  const expected = { learner: owner, epoch: store.epoch };
  return <HomeScreen key={`${owner}:${store.epoch}`} initialState={person.home}
    initialItem={params.item}
    badges={badgesFor(person.milestones)}
    ownedWallpapers={wallThemes.filter(id => !["math-lab","library","night-sky","arcade-neon"].includes(id) || person.earned.includes(id))}
    ownedFloors={floorThemes.filter(id => !["island-breeze","game-room"].includes(id) || person.earned.includes(id))}
    ownedItems={[...homeStickerItems(arcadeLearner(store.save.arcade, owner).stickers), ...person.earned.filter(id => furnitureIds.includes(id as typeof furnitureIds[number])) as ItemId[]]}
    persist={home => store.personalize({ home }, expected)}
    saveStatus={<SaveStatus/>}
    renderCharacter={(slot, pose, reaction, size, held, reduced) => slot === 0 ? <Islander view="front" pose={homeCharacterPose(pose,reaction)} look={person.look} size={size??86} held={held} reduced={reduced}/> : undefined}/>;
}
