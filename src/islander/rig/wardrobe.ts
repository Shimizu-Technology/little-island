import { accessories, hairStyles, hats, outfits, shoes } from '../look';
import { wardrobeRewards, type RewardSpec } from '../rewards';
import type { Joint, Point, Pose, View } from './poses';
export const paintLayers = ['rear-accessory', 'rear-hair', 'rear-limbs', 'body', 'clothing', 'front-limbs', 'hands', 'front-hair', 'face', 'hat', 'foreground-accessory'] as const;
export type Anchor = 'headTop' | 'face' | 'neck' | 'torso' | 'hips' | 'feet' | 'hand' | Joint;
export type WardrobeItem = Readonly<Partial<Pick<RewardSpec, 'earned' | 'track' | 'badge'>> & { id: string; slot: 'hair' | 'outfit' | 'hat' | 'accessory' | 'shoes'; views: readonly View[]; layers: readonly typeof paintLayers[number][]; anchors: readonly Anchor[]; occlusion: 'none' | 'compress-crown' | 'low-profile-roll' | 'head-over-pack' }>;
const both = ['front', 'back'] as const;
const baseWardrobe: readonly WardrobeItem[] = [
  ...hairStyles.map(id => ({ id, slot: 'hair' as const, views: both, layers: ['rear-hair', 'front-hair'] as const, anchors: ['headTop', 'face', 'neck'] as const, occlusion: 'compress-crown' as const })),
  ...outfits.map(id => ({ id, slot: 'outfit' as const, views: both, layers: ['rear-limbs', 'clothing', 'front-limbs'] as const, anchors: ['torso', 'hips', 'feet', 'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow', 'leftKnee', 'rightKnee'] as const, occlusion: 'none' as const })),
  ...shoes.map(id => ({ id, slot: 'shoes' as const, views: both, layers: ['rear-limbs'] as const, anchors: ['leftFoot', 'rightFoot'] as const, occlusion: 'none' as const })),
  ...hats.filter(id => id !== 'none').map(id => ({ id, slot: 'hat' as const, views: both, layers: ['hat'] as const, anchors: ['headTop'] as const, occlusion: 'low-profile-roll' as const })),
  ...accessories.filter(id => id !== 'none').map(id => ({ id, slot: 'accessory' as const, views: both, layers: id === 'calculator-watch' ? ['rear-limbs', 'front-limbs'] as const : id === 'flower-lei' || id === 'checker-scarf' ? ['front-hair', 'foreground-accessory'] as const : id === 'backpack' ? ['rear-accessory', 'clothing', 'foreground-accessory'] as const : ['foreground-accessory'] as const, anchors: id === 'calculator-watch' ? ['rightElbow', 'rightHand'] as const : id === 'flower-lei' || id === 'checker-scarf' ? ['neck'] as const : id === 'backpack' ? ['torso', 'leftShoulder', 'rightShoulder'] as const : ['face'] as const, occlusion: id === 'backpack' ? 'head-over-pack' as const : 'none' as const })),
];
export const wardrobe: readonly WardrobeItem[] = baseWardrobe.map(item => ({ ...wardrobeRewards.find(reward => reward.slot === item.slot && reward.id === item.id), ...item }));
export function anchorsFor(pose: Pose): Readonly<Record<Anchor, Point>> {
  const j = pose.joints;
  return { ...j, headTop: [j.head[0], j.head[1] - (pose.compact ? 12 : 28)], face: j.head, neck: j.neck, torso: [(j.leftShoulder[0] + j.rightShoulder[0]) / 2, (j.leftShoulder[1] + j.leftHip[1]) / 2], hips: [(j.leftHip[0] + j.rightHip[0]) / 2, j.leftHip[1]], feet: [(j.leftFoot[0] + j.rightFoot[0]) / 2, Math.max(j.leftFoot[1], j.rightFoot[1])], hand: j.rightHand };
}
