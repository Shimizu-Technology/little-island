import { TOPICS, WORLDS } from '../explore/content';
import type { Person } from '../personalization/model';
import { wardrobeRewards } from '../islander/rewards';
import { catalog, themeRewards } from '../home/catalog';
import { allLevelIds, arcadeIds, validLevelId, type LevelId } from '../arcade/types';
export const trackLabels = { math: 'Math', reading: 'Reading', science: 'Science & Thinking', coding: 'Coding', chamoru: 'CHamoru words', arcade: 'Arcade', classic: 'Classic & Board' };
export const tracks = ['math', 'reading', 'science', 'coding', 'chamoru', 'arcade', 'classic'] as const;
export type Track = typeof tracks[number];
export const countThresholds: Record<Track, readonly [number,number,number,number]> = { math:[1,3,6,10], reading:[1,3,6,10], science:[1,3,6,10], coding:[1,3,6,10], chamoru:[1,3,4,7], arcade:[1,8,0,40], classic:[1,3,6,10] };
export type BadgeId = `${Track}-${1|2|3|4}`;
export type Completion = { kind: 'learning'; game: string; level: number; helped: boolean } | { kind: 'arcade'; game: string; level: string } | { kind: 'classic'; game: string; won?: boolean; opponentStrength?: string } | { kind: 'explore'; topic: string };
const names = { math: ['Counter','Builder','Problem Solver','Math Star'], reading: ['First Words','Page Turner','Storyteller','Bookworm'], science: ['Curious','Explorer','Scientist','Inventor'], coding: ['First Steps','Looper','Debugger','Coder'], chamoru: ['Håfa Adai','Neighbor','Storykeeper','Island Voice'], arcade: ['Player One','Level Hopper','World Opener','Legend'], classic: ['Game Night','Good Sport','Strategist','Champion'] };
const colors = { math:'#BD7041', reading:'#6674A9', science:'#348579', coding:'#526EAF', chamoru:'#AC627B', arcade:'#357EAA', classic:'#8B7445' };
export const learningTrack: Record<string, Track> = { 'shell-math':'math','number-hop':'math','reef-race':'math','island-market':'math','quick-practice':'math','sound-boat':'reading','turtle-tales':'reading','which-one':'reading','tide-pool':'science','float-sink':'science','crab-commands':'coding','hafa-adai':'chamoru','chamoru-memory':'chamoru','beep-bot':'coding','turtle-draw':'coding','tide-logic':'coding','code-lab':'coding','pattern-path':'science','shape-shift':'science','logic-lagoon':'science','weather-watch':'science','food-web':'science','space-station':'science','times-tide':'math','fraction-feast':'math','treasure-algebra':'math','letter-lagoon':'reading','word-workshop':'reading','story-studio':'reading' };
export const classicGames = ['tic-tac-toe','word-rescue','memory','checkers','maze','numbers','coconut-drop','fishing-nets','hidden-canoes','shell-pits','reef-sweep','go-fish','crazy-eights','racer','word-imposter','island-mystery'];
export const arcadeTrack = (game: string): Track => ['shell-song','rail-parade'].includes(game) ? 'reading' : 'math';
/** Catalog v1 is retained for old saves. Bound every durable accomplishment by real content. */
export const milestoneCatalog = [
  ...Object.keys(learningTrack).flatMap(game => (game === 'chamoru-memory' ? [1,2,3] : [1,2,3,4,5]).map(level => `learn:${game}:${level}`)),
  ...arcadeIds.flatMap(game => allLevelIds.map(level => `arcade:${game}:${level}`)),
  ...classicGames.map(game => `classic:${game}`),
  ...['tic-tac-toe','checkers','coconut-drop','fishing-nets','hidden-canoes','shell-pits'].map(game => `classic:${game}:win`),
  ...TOPICS.map(topic => `explore:${topic.id}`), ...WORLDS.map(world => `explore:lab-${world.id}`),
  'world:open-3', 'migration:badges-v1',
];
// Includes all catalog pairs, all shortcuts and migration markers, plus future headroom.
export const MAX_MILESTONES = milestoneCatalog.length + 64;
export const validMilestone = (id: string) => milestoneCatalog.includes(id);
export const grantCatalog = () => grantsFor(tracks.flatMap(track => [1,2,3,4].map(tier => `${track}-${tier}` as BadgeId)));
export function badgeInfo(id: BadgeId) {
  const [track, tierText] = id.split('-') as [Track,string], tier = Number(tierText);
  const counts = countThresholds[track];
  const subject = { math: 'math games or levels', reading: 'reading games or levels', science: 'science games, levels or Explore topics', coding: 'coding games or levels', chamoru: 'CHamoru games or levels', arcade: '', classic: '' }[track];
  const rule = track === 'arcade'
    ? ['Clear any arcade level.', 'Clear 8 different arcade levels.', 'Open World 3 in any arcade game or clear every level of one world.', 'Clear a World 6 arcade level or 40 different arcade levels.'][tier - 1]
    : track === 'classic'
      ? ['Finish any classic or board game.', 'Finish 3 different classic or board games.', 'Finish 6 different classic or board games.', 'Win a classic board game against a middle or strong opponent, or finish 10 different classic or board games.'][tier - 1]
      : [
        `Finish any ${track === 'chamoru' ? 'CHamoru words' : track === 'science' ? 'science & thinking' : track} round${track === 'science' ? ' or Explore topic' : ''}.`,
        `Finish ${counts[1]} different ${subject}.`,
        `Finish a ${trackLabels[track]} round at Level 3 or higher, or finish ${counts[2]} different ${subject}.`,
        `Finish a ${trackLabels[track]} round at Level 5, or finish ${counts[3]} different ${subject}.`,
      ][tier - 1];
  return { name:names[track][tier-1], rule, track, color:colors[track] };
}
export const badgeRule = (id: BadgeId) => { const b = badgeInfo(id); return `Earn ${b.name}: ${b.rule}`; };
function entries(milestones: readonly string[], track: Track) {
  return [...new Set(milestones)].filter(id => {
    const [kind,game] = id.split(':');
    if (track === 'classic') return kind === 'classic';
    if (kind === 'arcade') return track === 'arcade' || id.split(':')[2]?.startsWith('learn-') && arcadeTrack(game) === track;
    return kind === 'explore' ? track === 'science' : kind === 'learn' && learningTrack[game] === track;
  });
}
function tiers(track: Track, milestones: readonly string[]) {
  const ids = entries(milestones,track), n = ids.filter(id => !id.endsWith(':win')).length;
  if (track === 'classic') return [n>=1,n>=3,n>=6,n>=10 || ids.some(id=>id.endsWith(':win'))];
  if (track === 'arcade') {
    const perGame = arcadeIds.map(game => ids.filter(id=>id.startsWith(`arcade:${game}:`)).map(id=>id.split(':')[2] as LevelId));
    return [n>=1,n>=8, milestones.includes('world:open-3') || perGame.some(levels=>['w1','w2','w3','w4','w5','w6','learn'].some(w=>allLevelIds.filter(l=>l.startsWith(`${w}-`)).every(l=>levels.includes(l)))),n>=40 || ids.some(id=>/:w6-/.test(id))];
  }
  const high = Math.max(0,...ids.filter(id=>id.startsWith('learn:')).map(id=>Number(id.split(':')[2])));
  const counts=countThresholds[track];
  return [n>=counts[0],n>=counts[1],high>=3 || n>=counts[2],high>=5 || n>=counts[3]];
}
export function badgesFor(milestones: readonly string[]): BadgeId[] {
  return tracks.flatMap(track=>tiers(track,milestones).flatMap((earned,i)=>earned ? [`${track}-${i+1}` as BadgeId] : []));
}
export function progressFor(track: Track, milestones: readonly string[] = [], targetTier?: 1|2|3|4) {
  const earned = tiers(track,milestones), next = targetTier ? targetTier - 1 : earned.findIndex(v=>!v);
  if (next < 0) return 'All four badges earned';
  const count = entries(milestones,track).filter(id=>!id.endsWith(':win')).length, target = countThresholds[track][next];
  return target ? `${Math.min(count,target)} of ${target} done` : badgeInfo('arcade-3').rule;
}
export function progressForBadge(id: BadgeId, milestones: readonly string[]) {
  const info = badgeInfo(id);
  return progressFor(info.track, milestones, Number(id.slice(-1)) as 1|2|3|4);
}
export function grantsFor(badges: readonly BadgeId[]): string[] {
  return [...new Set([
    ...wardrobeRewards.filter(r=>badges.includes(r.badge)).map(r=>`${r.slot.toLowerCase()}:${r.id}`),
    ...Object.entries(catalog).filter(([,r])=>'badge' in r && badges.includes(r.badge as BadgeId)).map(([id])=>id),
    ...themeRewards.filter(r=>badges.includes(r.badge)).map(r=>r.id),
  ])];
}
export function milestoneFor(fact: Completion): string | undefined {
  if(fact.kind==='learning') return validMilestone(`learn:${fact.game}:${fact.level}`) ? `learn:${fact.game}:${fact.level}` : undefined;
  if(fact.kind==='arcade') return arcadeIds.includes(fact.game as typeof arcadeIds[number]) && validLevelId(fact.level) ? `arcade:${fact.game}:${fact.level}` : undefined;
  if(fact.kind==='classic') return classicGames.includes(fact.game) ? `classic:${fact.game}` : undefined;
  return (TOPICS.some(t => t.id === fact.topic) || WORLDS.some(w => `lab-${w.id}` === fact.topic)) ? `explore:${fact.topic}` : undefined;
}
/** Keep the earliest evidence forever. Saturated tracks need no more pairs, leaving room for every other track. */
export function applyCompletion(person: Person, fact: Completion): Person {
  const id = milestoneFor(fact); if(!id) return person;
  const before = badgesFor(person.milestones), affected: Track[] = fact.kind==='arcade' ? (fact.level.startsWith('learn-') ? ['arcade',arcadeTrack(fact.game)] : ['arcade']) : [fact.kind==='classic'?'classic':fact.kind==='explore'?'science':learningTrack[fact.game]];
  const win = fact.kind==='classic' && fact.won && ['tic-tac-toe','checkers','coconut-drop','fishing-nets','hidden-canoes','shell-pits'].includes(fact.game) && ['middle','strong','medium','hard','growing','challenge'].includes(fact.opponentStrength ?? '') ? `classic:${fact.game}:win` : undefined;
  const additions = [...(affected.every(t=>([1,2,3,4] as const).every(tier=>before.includes(`${t}-${tier}`))) ? [] : [id]), ...(win?[win]:[])].filter(m=>!person.milestones.includes(m));
  if (!additions.length || person.milestones.length + additions.length > MAX_MILESTONES) return person;
  const milestones = [...person.milestones,...additions], newBadges = badgesFor(milestones).filter(b=>!before.includes(b)), grants = grantsFor(newBadges).filter(g=>!person.earned.includes(g));
  if (person.earned.length + grants.length > grantCatalog().length) return person;
  return { ...person, milestones, earned:[...person.earned,...grants], unseen:[...person.unseen,...grants] };
}
