import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Filter, FeColorMatrix, G } from 'react-native-svg';
import { IslanderShape, resolvePose, type IslanderLook } from '../islander';
import { C, Copy, PressableScale } from '../components/ui';
import { lookWithStyle, lockedReason, selectedValue, styleCatalog, type Category, type StyleItem } from './catalog';
import { LockBadge, LockIcon } from './LockBadge';
import { thumbnailFocus } from './thumbnail';
export function StyleGrid({ category, look, equipped, earned, unseen, onChoose, catalog = styleCatalog, compact = false }: { category: Category; look: IslanderLook; equipped: IslanderLook; earned: string[]; unseen: string[]; onChoose: (item: StyleItem) => void; compact?: boolean; catalog?: readonly StyleItem[] }) {
  const { width } = useWindowDimensions();
  const tileWidth = width < 420 ? '47%' : width < 700 ? '31%' : width < 1100 ? '47%' : '31%';
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: compact ? 6 : 10 }}>{catalog.filter(i => i.category === category).map(item => {
    const selected = selectedValue(look, item.category) === item.value, worn = selectedValue(equipped, item.category) === item.value, reason = lockedReason(item, earned);
    return <PressableScale key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label}${reason ? ', locked. ' + reason : ''}${selected ? ', previewing' : ''}${worn ? ', wearing' : ''}`} accessibilityState={{ selected }} onPress={() => onChoose(item)} style={{ width: tileWidth, minWidth: 96, minHeight: compact ? 108 : 148, alignItems: 'center', justifyContent: 'center', gap: compact ? 1 : 3, padding: compact ? 3 : 5, borderWidth: 2, borderColor: selected ? C.teal : C.line, backgroundColor: selected ? '#E7F2E7' : C.paper, borderRadius: 22 }}>
      <View style={{ width: compact ? 64 : 100, height: compact ? 64 : 100, borderRadius: 50, borderWidth: 3, borderColor: selected ? C.teal : '#E9E9DE', backgroundColor: '#FFF4E7', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>{item.color ? <><Svg width={compact ? 60 : 88} height={compact ? 60 : 88} viewBox={thumbnailFocus(item).box} accessible={false}><IslanderShape pose={resolvePose('front', 'idle')} look={lookWithStyle(look, item)}/></Svg><View style={{ position: 'absolute', bottom: 3, right: 3, width: 26, height: 26, borderRadius: 13, backgroundColor: reason ? '#A4A4A4' : item.color, borderWidth: 2, borderColor: '#FFFFFF' }}/></> : <Svg width={compact ? 68 : 105} height={compact ? 68 : 105} viewBox={thumbnailFocus(item).box} accessible={false}><Defs><Filter id={`muted-${item.id}`}><FeColorMatrix type="saturate" values="0"/></Filter></Defs><G opacity={reason ? .48 : 1} filter={reason ? `url(#muted-${item.id})` : undefined}><IslanderShape pose={resolvePose(thumbnailFocus(item).view, thumbnailFocus(item).view === 'back' ? 0 : 'idle')} look={lookWithStyle(look, item)}/></G></Svg>}</View>
      {!!reason && <LockBadge/>}
      <Copy style={{ fontWeight: '700', fontSize: 14, lineHeight: 17, textAlign: 'center', color: C.ink }}>{item.label}</Copy>
      {(selected || worn) && <Copy style={{ fontSize: 10, lineHeight: 11 }}>{selected ? 'Previewing' : 'Wearing'}</Copy>}
      {!!reason && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><LockIcon/><Text numberOfLines={1} style={{ fontSize: 11, lineHeight: 16, flexShrink: 1, color: C.ink }}>{item.track}</Text></View>}
      {unseen.includes(item.id) && <Copy style={{ fontSize: 12 }}>New</Copy>}

    </PressableScale>;
  })}</View>;
}
