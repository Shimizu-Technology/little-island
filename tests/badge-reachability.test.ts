import { describe, expect, it } from 'vitest';
import { badgesFor, countThresholds, learningTrack, milestoneFor, tracks, type Completion, type Track, type BadgeId } from '../src/badges/engine';
import { learnIds } from '../src/learn/types';
import { levelNumbers, levelOf } from '../src/learn/levels';
import { gameIds, difficultyLabel } from '../src/games';
import type { Difficulty } from '../src/games/types';
import { boardIds } from '../src/board';
import { activityIds } from '../src/state/activities';
import { arcadeGames } from '../src/arcade/registry';
import { allLevelIds, worldOf, worldStars } from '../src/arcade/types';
import { openedWorlds } from '../src/arcade/progress';
import { TOPICS, WORLDS } from '../src/explore/content';

/** Inventory comes from actual playable catalogs, never an invented number of pairs. */
const inventory = (track: Track, below = Infinity): Completion[] => {
  const learning: Completion[] = learnIds.filter(game=>learningTrack[game]===track).flatMap(game=>levelNumbers.filter(level=>level<below).map(level=>({kind:'learning' as const,game,level,helped:true})));
  if(track==='chamoru') learning.push(...(Object.keys(difficultyLabel) as Difficulty[]).map(pace=>levelOf({mode:'solo',pace})).filter(level=>level<below).map(level=>({kind:'learning' as const,game:'chamoru-memory',level,helped:true})));
  if(track==='science') learning.push(...[...TOPICS.map(t=>t.id),...WORLDS.map(w=>`lab-${w.id}`)].map(topic=>({kind:'explore' as const,topic})));
  if(track==='math' || track==='reading' || track==='arcade') learning.push(...arcadeGames.filter(g=>track==='arcade' || g.subject===track).flatMap(g=>allLevelIds.filter(level=>g.worlds.some(w=>w.id===worldOf(level) && (track==='arcade' || w.learning))).map(level=>({kind:'arcade' as const,game:g.id,level}))));
  if(track==='classic') learning.push(...[...gameIds,...boardIds,...activityIds].map(game=>({kind:'classic' as const,game,won:false})));
  return learning;
};
const milestones = (facts: Completion[]) => [...new Set(facts.map(milestoneFor).filter((id): id is string=>!!id))];
describe('count routes remain independently reachable from current content',()=>{
  for(const track of tracks) for(const tier of [1,2,3,4] as const) {
    if(track==='arcade' && tier===3) continue; // Its alternative is a complete world, tested below.
    it(`${track}-${tier}: enough distinct accomplishments without its shortcut`,()=>{
      const threshold=track==='arcade' ? countThresholds.arcade[tier-1] : countThresholds[track][tier-1];
      const below=track==='arcade' || track==='classic' ? Infinity : tier===3 ? 3 : tier===4 ? 5 : Infinity;
      let facts=inventory(track,below);
      if(track==='arcade' && tier===4) facts=facts.filter(f=>f.kind==='arcade' && worldOf(f.level as typeof allLevelIds[number])!=='w6');
      const available=milestones(facts), chosen=available.slice(0,threshold), badge:BadgeId=`${track}-${tier}`;
      expect(available.length,`${badge}: catalog offers ${available.length}, rule needs ${threshold}`).toBeGreaterThanOrEqual(threshold);
      expect(badgesFor(chosen)).toContain(badge);
      // With no high-level/opponent shortcut present, threshold-1 must remain insufficient.
      expect(badgesFor(chosen.slice(0,-1))).not.toContain(badge);
      if(Number.isFinite(below)) expect(facts.filter(f=>f.kind==='learning').every(f=>f.kind==='learning' && f.level<below)).toBe(true);
      if(track==='classic') expect(chosen.some(m=>m.endsWith(':win'))).toBe(false);
    });
  }
  for(const track of tracks.filter(t=>t!=='arcade')) it(`${track}: tiers 2→4 counts strictly increase`,()=>{
    const counts=countThresholds[track];expect(counts[1]).toBeLessThan(counts[2]);expect(counts[2]).toBeLessThan(counts[3]);
  });
  it('World Opener can clear a world without opening World 3',()=>{
    const game=arcadeGames[0], world=game.worlds.find(w=>w.stars===0 && !w.learning)!;
    const levels=allLevelIds.filter(level=>worldOf(level)===world.id), stars=Object.fromEntries(levels.map(level=>[level,1 as const]));
    expect(levels.length).toBeGreaterThan(0);expect(Object.values(stars).reduce((a,b)=>a+b,0)).toBeLessThan(worldStars.w3);
    expect(openedWorlds(stars)).not.toContain('w3');expect(badgesFor(levels.map(level=>`arcade:${game.id}:${level}`))).toContain('arcade-3');
  });
});
