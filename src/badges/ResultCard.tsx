import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../state/Store';
import { Button, Copy, Heading } from '../components/ui';
import { badgeInfo, grantsFor } from './engine';
import { wardrobeRewards } from '../islander/rewards';
import { catalog, themeRewards } from '../home/catalog';
export function BadgeResultCard({ round }: { round: string }) {
  const store=useStore(), result=store.badgeResult;
  if(!result || result.source!==round || result.owner!==(store.save.learning?.active ?? 'family') || result.epoch!==store.epoch) return null;
  const badge=result.badges[result.badges.length-1], info=badgeInfo(badge), grants=grantsFor([badge]);
  const wearable=wardrobeRewards.find(r=>r.badge===badge), home=grants.find(id=>id in catalog || themeRewards.some(t=>t.id===id));
  const homeName=home && (home in catalog ? catalog[home as keyof typeof catalog].name : themeRewards.find(t=>t.id===home)?.name);
  return <View testID="new-badge-card" style={{ padding:16, gap:10, borderRadius:20, backgroundColor:'#FFF6DA', borderColor:info.color, borderWidth:1, alignSelf:'stretch' }}>
    <Heading style={{fontSize:20}}>New badge: {info.name}</Heading>
    <Copy>{homeName ? `Ready for your home: ${homeName}.` : `${wearable?.name} is ready to wear.`}</Copy>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
      {wearable && <Button compact onPress={()=>{store.dismissBadge(); router.push({pathname:'/locker',params:{item:`${wearable.slot.toLowerCase()}:${wearable.id}`}});}}>Try it on</Button>}
      {home && <Button compact onPress={()=>{store.dismissBadge();router.push({pathname:'/island-home',params:{item:home}});}}>See it at home</Button>}
      <Button compact quiet onPress={store.dismissBadge}>Keep playing</Button>
      <Button compact quiet onPress={()=>{store.dismissBadge();router.push('/');}}>Home</Button>
    </View>
  </View>;
}
