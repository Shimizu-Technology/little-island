import React from 'react';
import { View } from 'react-native';
import { Islander, type IslanderLook } from '../islander';
/** Center the 80×132 rig; leave room above its highest hat and curls. */
export function Portrait({ look, size = 40 }: { look: IslanderLook; size?: number }) {
  const body = size * 2.05;
  return <View testID="learner-portrait" style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#D5E6DA' }}>
    <View style={{ position: 'absolute', top: size * .04, left: (size - body * 80 / 132) / 2 }}><Islander look={look} view="front" pose="idle" size={body}/></View>
  </View>;
}
