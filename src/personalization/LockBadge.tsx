import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { C, Copy } from '../components/ui';
export function LockIcon() { return <Svg width={16} height={18} viewBox="0 0 24 24" accessible={false}><Path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke={C.ink} strokeWidth={2.5}/><Rect x={5} y={10} width={14} height={11} rx={3} fill={C.gold} stroke={C.ink} strokeWidth={2}/></Svg>; }
export function LockBadge() { return <View pointerEvents="none" style={{ position: 'absolute', top: 5, right: 5, padding: 4, backgroundColor: C.cream, borderRadius: 12, borderWidth: 1, borderColor: C.ink }}><LockIcon/></View>; }
export function LockRule({ children }: { children: string }) { return <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 8, padding: 10, borderRadius: 12, backgroundColor: '#FFF1CB', borderWidth: 1, borderColor: '#BD7041' }}><LockIcon/><Copy style={{ flex: 1, color: C.ink, fontSize: 14 }}>{children}</Copy></View>; }
