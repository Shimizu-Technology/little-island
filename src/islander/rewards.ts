import type { IslanderLook } from './look';
export const rewardTracks = ['math', 'reading', 'science', 'coding', 'chamoru', 'arcade', 'classic'] as const;
export type RewardTrack = typeof rewardTracks[number];
export type RewardSpec = { id: string; slot: keyof IslanderLook; name: string; earned: true; track: RewardTrack; badge: `${RewardTrack}-${1|2|3|4}` };
function reward(id: string, slot: keyof IslanderLook, name: string, track: RewardTrack, tier: 1|2|3|4): RewardSpec { return {id, slot, name, earned: true, track, badge: `${track}-${tier}`}; }
/** `earned` denotes badge-gated catalog content, never ownership. Starters remain unchanged. */
export const wardrobeRewards: readonly RewardSpec[] = [
  reward('calculator-watch','accessory','Calculator watch','math',1),
  reward('number-tee','outfit','Number-pattern tee','math',2),
  reward('star-math','palette','Star-math','math',4),
  reward('bookworm-beanie','hat','Bookworm beanie','reading',1),
  reward('storyteller','palette','Storyteller','reading',3),
  reward('reading-glasses','accessory','Round reading glasses','reading',4),
  reward('safety-goggles','accessory','Safety goggles','science',1),
  reward('lab-coat','outfit','Lab coat','science',2),
  reward('galaxy','hairColor','Galaxy','science',4),
  reward('robot-tee','outfit','Robot tee','coding',1),
  reward('coder-headset','accessory','Coder headset','coding',3),
  reward('flower-lei','accessory','Flower lei','chamoru',1),
  reward('woven-sunhat','hat','Woven sun hat','chamoru',2),
  reward('sunset','palette','Sunset','chamoru',4),
  reward('runner-headband','hat',"Runner’s headband",'arcade',1),
  reward('lagoon-jersey','outfit','Lagoon jersey','arcade',2),
  reward('star-sneakers','palette','Star sneakers','arcade',3),
  reward('lightning-streak','hairColor','Lightning streak','arcade',4),
  reward('captain-cap','hat',"Captain’s cap",'classic',1),
  reward('checker-scarf','accessory','Checker scarf','classic',3),
  reward('royal','palette','Royal','classic',4),
];
