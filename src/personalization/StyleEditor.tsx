import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, View, useWindowDimensions, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Islander, presentationPresets, type IslanderLook } from '../islander';
import { C, Copy, Heading, PressableScale } from '../components/ui';
import { Icon } from '../components/Icon';
import { categories, lockedReason, lookWithStyle, styleCatalog, type Category, type StyleItem } from './catalog';
import { LockRule } from './LockBadge';
import { StyleGrid } from './StyleGrid';

type Tab = Category | 'presentation' | 'build' | 'shoes' | 'shoeColor';
type Group = { name: string; color: string; tint: string; tabs: Tab[] };
const groups: Group[] = [
  { name: 'Me', color: '#DFAE37', tint: '#FFF2B8', tabs: ['presentation', 'skinTone', 'build'] },
  { name: 'Head', color: '#258F8B', tint: '#CCF4EB', tabs: ['hairStyle', 'hairColor', 'brows', 'lashes', 'freckles', 'cheeks'] },
  { name: 'Clothes', color: '#DE765C', tint: '#FFE0D2', tabs: ['outfit', 'top', 'bottom', 'palette', 'shoes', 'shoeColor'] },
  { name: 'Extras', color: '#D47777', tint: '#FFE0DE', tabs: ['hat', 'accessory'] },
];
const labels: Record<string, string> = { presentation: 'Me', skinTone: 'Skin', hairStyle: 'Hair', hairColor: 'Hair colour', palette: 'Clothes colour', outfit: 'Outfit', top: 'Top', bottom: 'Bottom', hat: 'Hat', accessory: 'Extra', brows: 'Brows', lashes: 'Lashes', freckles: 'Freckles', cheeks: 'Cheeks', build: 'Build', shoes: 'Shoes', shoeColor: 'Shoe colour' };

function TabPicture({ tab, color }: { tab: Tab; color: string }) {
  const line = { fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <Svg width={27} height={27} viewBox="0 0 32 32" accessible={false}>
    {(['presentation', 'skinTone', 'build'] as Tab[]).includes(tab) && <><Circle cx={16} cy={9} r={5} {...line}/><Path d="M7 27v-4c0-5 4-8 9-8s9 3 9 8v4" {...line}/></>}
    {(['hairStyle', 'hairColor', 'hat'] as Tab[]).includes(tab) && <><Path d="M7 16c-1-8 3-13 9-13s10 5 9 13l-2 9H9z" {...line}/><Path d="M10 17c4 0 7-3 9-5 2 3 4 4 6 4" {...line}/></>}
    {tab === 'hairColor' && <Path d="M12 8q-3 7 0 15m5-16q-3 7 0 16" {...line}/>}
    {(['brows', 'lashes', 'freckles', 'cheeks'] as Tab[]).includes(tab) && <><Path d="M4 13c4-4 8-4 11 0m2 0c4-4 8-4 11 0" {...line}/><Circle cx={10} cy={18} r={2} fill={color}/><Circle cx={22} cy={18} r={2} fill={color}/><Path d="M12 24q4 3 8 0" {...line}/></>}
    {(['outfit', 'top', 'bottom', 'palette'] as Tab[]).includes(tab) && <Path d="M11 4l5 3 5-3 7 6-4 5-3-2v15H11V13l-3 2-4-5z" {...line}/>}
    {(['shoes', 'shoeColor'] as string[]).includes(tab) && <><Path d="M5 20h7l5 4h9v4H5z" {...line}/><Path d="M5 20v-6" {...line}/></>}
    {(['hairColor', 'palette', 'shoeColor'] as Tab[]).includes(tab) && <Path d="M25 3c-1 3-4 5-4 8a4 4 0 0 0 8 0c0-3-3-5-4-8z" fill={color}/>}
    {tab === 'accessory' && <><Rect x={3} y={12} width={11} height={9} rx={4} {...line}/><Rect x={18} y={12} width={11} height={9} rx={4} {...line}/><Path d="M14 15q2-2 4 0" {...line}/></>}
  </Svg>;
}

export function StyleEditor({ look, equipped, earned, unseen, onChange, onSeen, initialTab = 'presentation', initialItem, creator = false, onBadges }: {
  look: IslanderLook; equipped: IslanderLook; earned: string[]; unseen: string[];
  onChange: (look: IslanderLook, item?: StyleItem) => void; onSeen?: (id: string) => void;
  initialTab?: Tab; initialItem?: StyleItem; creator?: boolean; onBadges?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height && height < 550;
  const side = width >= 700 || landscape;
  const [tab, setTab] = useState<Tab>(initialTab);
  const tabScroll = useRef<ScrollView>(null);
  const [back, setBack] = useState(false);
  const [detail, setDetail] = useState<StyleItem | undefined>(initialItem);
  const reason = detail && lockedReason(detail, earned);
  const visibleGroups = useMemo(() => groups.map(g => ({ ...g, tabs: g.tabs.filter(t => t === 'presentation' || styleCatalog.some(i => i.category === t)) })).filter(g => g.tabs.length), []);
  useEffect(() => {
    let x = 0;
    for (const group of visibleGroups) {
      const index = group.tabs.indexOf(tab);
      if (index >= 0) { x += index * 67; break; }
      x += group.tabs.length * 67 + 11;
    }
    const timer = setTimeout(() => tabScroll.current?.scrollTo({ x: Math.max(0, x - Math.min(width, 650) / 3), animated: false }), 0);
    return () => clearTimeout(timer);
  }, [tab, width, visibleGroups]);
  const currentGroup = visibleGroups.find(g => g.tabs.includes(tab)) ?? visibleGroups[0];
  const snapOffsets = useMemo(() => visibleGroups.flatMap((group, groupIndex) => {
    const start = visibleGroups.slice(0, groupIndex).reduce((sum, previous) => sum + previous.tabs.length * 67 + 11, 0);
    return group.tabs.map((_, index) => start + index * 67);
  }), [visibleGroups]);
  const previewSize = landscape ? (reason ? 100 : 145) : side ? Math.min(290, height * .48) : Math.min(205, height * .27);
  const preview = <View testID="style-preview" style={{ minHeight: previewSize + 24, borderRadius: 28, backgroundColor: '#E0F0E9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingVertical: 12 }}>
    <Islander view={back ? 'back' : 'front'} pose={back ? 0 : 'idle'} look={look} size={previewSize}/>
    <PressableScale accessibilityRole="button" accessibilityLabel={back ? 'See the front' : 'See the back'} onPress={() => setBack(!back)} style={{ position: 'absolute', right: 10, top: 10, width: 46, height: 46, borderRadius: 23, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' }}><Icon name="refresh"/></PressableScale>
    {!!onBadges && <PressableScale accessibilityRole="button" accessibilityLabel="My badges" onPress={onBadges} style={{ position: 'absolute', right: 10, bottom: 10, paddingHorizontal: 12, minHeight: 42, borderRadius: 21, backgroundColor: C.paper, justifyContent: 'center' }}><Copy style={{ color: C.ink, fontSize: 13, fontWeight: '700' }}>My badges</Copy></PressableScale>}
  </View>;
  const tabs = <View testID="style-tabs" style={{ borderRadius: 22, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, paddingVertical: 8 }}><View accessibilityLiveRegion="polite" style={{ alignSelf: 'flex-start', marginLeft: 12, marginBottom: 5, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12, backgroundColor: currentGroup.tint }}><Copy style={{ color: C.ink, fontSize: 12, lineHeight: 16, fontWeight: '700' }}>{currentGroup.name}</Copy></View><ScrollView ref={tabScroll} horizontal snapToOffsets={snapOffsets} decelerationRate="fast" style={Platform.OS === 'web' ? { scrollSnapType: 'x mandatory' } as ViewStyle : undefined} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 8 }}>
    {visibleGroups.map(group => <View key={group.name} style={{ flexDirection: 'row', gap: 3, padding: 4, borderRadius: 19, backgroundColor: group.tint, alignItems: 'center' }}>{group.tabs.map(t => {
      const active = tab === t;
      return <PressableScale key={t} accessibilityRole="tab" accessibilityLabel={`${group.name}, ${labels[t]}`} accessibilityState={{ selected: active }} onPress={() => { setTab(t); setDetail(undefined); }} style={{ ...(Platform.OS === 'web' ? { scrollSnapAlign: 'start' } as ViewStyle : {}), width: 64, minHeight: landscape ? 64 : 76, borderRadius: 17, backgroundColor: active ? group.color : 'transparent', alignItems: 'center', justifyContent: 'center', gap: 1, borderWidth: active ? 2 : 0, borderColor: C.ink }}><TabPicture tab={t} color={active ? '#FFFFFF' : C.ink}/><Copy style={{ color: active ? '#FFFFFF' : C.ink, fontSize: 11, lineHeight: 15, fontWeight: '700', textAlign: 'center' }}>{labels[t].replace(' colour', '\ncolour')}</Copy></PressableScale>;
    })}</View>)}
  </ScrollView></View>;
  const choices = <View style={{ gap: 10 }}>
    {!(creator && landscape && tab === 'presentation') && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 7, height: 29, borderRadius: 4, backgroundColor: currentGroup.color }}/><Heading style={{ fontSize: 22 }}>{tab === 'presentation' ? "Who's your islander?" : categories.find(c => c.key === tab)?.label ?? labels[tab]}</Heading></View>}
    {creator && !landscape && !!look.presentation && <Copy style={{ fontSize: 14 }}>Tap the pictures below to style your islander.</Copy>}
    {tab === 'presentation' ? <><View style={{ flexDirection: 'row', gap: 8 }}>{(['boy', 'girl', 'me'] as const).map(value => {
      const chosen = look.presentation === value;
      const candidate = { ...look, ...presentationPresets[value] } as IslanderLook;
      return <PressableScale key={value} accessibilityRole="button" accessibilityLabel={value === 'me' ? 'Just me' : value === 'boy' ? 'Boy' : 'Girl'} accessibilityState={{ selected: chosen }} onPress={() => onChange(candidate)} style={{ flex: 1, minWidth: 0, minHeight: landscape ? 84 : 132, alignItems: 'center', justifyContent: 'center', padding: 5, borderRadius: 22, borderWidth: 3, borderColor: chosen ? currentGroup.color : C.line, backgroundColor: chosen ? currentGroup.tint : C.paper }}><Islander look={candidate} size={landscape ? 48 : 79}/><Copy style={{ fontWeight: '700', fontSize: 14, lineHeight: 18, color: C.ink, textAlign: 'center' }}>{value === 'me' ? 'Just me' : value === 'boy' ? 'Boy' : 'Girl'}</Copy></PressableScale>;
    })}</View>{!landscape && <Copy style={{ fontSize: 13 }}>Anyone can wear anything.</Copy>}</> : <StyleGrid compact={landscape} category={tab as Category} look={look} equipped={equipped} earned={earned} unseen={unseen} onChoose={item => { onChange(lookWithStyle(look, item), item); setDetail(item); onSeen?.(item.id); }}/ >}
  </View>;
  if (creator && landscape) return <View style={{ flexDirection: 'row', gap: 12, height: Math.max(180, height - 180), width: '100%' }}>
    <View style={{ width: '39%', gap: 6 }}>{preview}{reason ? <LockRule>{reason}</LockRule> : <Copy style={{ fontSize: 12, lineHeight: 16 }}>Tap the pictures to style your islander.</Copy>}</View>
    <View style={{ flex: 1, gap: 8 }}>{tabs}{!landscape && !!reason && <LockRule>{reason}</LockRule>}<ScrollView style={{ flex: 1 }} nestedScrollEnabled contentContainerStyle={{ paddingBottom: 12 }}>{choices}</ScrollView></View>
  </View>;
  if (!creator && side) return <View style={{ flexDirection: 'row', gap: 12, height: Math.max(180, height - (landscape ? 155 : 230)), width: '100%', maxWidth: 1100, alignSelf: 'center' }}>
    <View style={{ width: '39%', gap: 8 }}>{preview}{landscape && !!reason && <LockRule>{reason}</LockRule>}</View>
    <View style={{ flex: 1, gap: 8 }}>{tabs}{!landscape && !!reason && <LockRule>{reason}</LockRule>}<ScrollView style={{ flex: 1 }} nestedScrollEnabled contentContainerStyle={{ paddingBottom: 12 }}>{choices}</ScrollView></View>
  </View>;
  if (!creator) return <View style={{ height: Math.max(390, height - 230), gap: 8, width: '100%' }}>
    {preview}{tabs}{!!reason && <LockRule>{reason}</LockRule>}
    <ScrollView style={{ flex: 1 }} nestedScrollEnabled contentContainerStyle={{ paddingBottom: 12 }}>{choices}</ScrollView>
  </View>;
  if (!side) return <View style={{ height: Math.max(390, height - 190), gap: 8, width: '100%' }}>
    {preview}{tabs}{!!reason && <LockRule>{reason}</LockRule>}
    <ScrollView style={{ flex: 1 }} nestedScrollEnabled contentContainerStyle={{ paddingBottom: 12 }}>{choices}</ScrollView>
  </View>;
  return <View style={{ flexDirection: side ? 'row' : 'column', gap: 12, width: '100%', maxWidth: 1100, alignSelf: 'center' }}>
    <View style={side ? { width: '39%' } : undefined}>{preview}</View>
    <View style={{ flex: side ? 1 : undefined, gap: 12 }}>{tabs}{!!reason && <LockRule>{reason}</LockRule>}{choices}</View>
  </View>;
}
