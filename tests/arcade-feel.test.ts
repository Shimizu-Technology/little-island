import { describe, expect, it } from "vitest";
import { allLevelIds, worldIds, worldStars, validLevelId, type LevelId } from "../src/arcade/types";
import { arcadeGames } from "../src/arcade/registry";
import { arcadeTransition, emptyArcade, emptyArcadeLearner, emptyGameProgress, migrateArcade, openedOutfits, openedWorlds, validArcade, type ArcadeSave } from "../src/arcade/progress";
import { emptySave, parseSave } from "../src/state/validation";
import { createLives, configureLives, hitLives, stepLives, validLives } from "../src/arcade/lives";
import { createSong, songLevel, songResult, songStep, songTransition, validSong, type SongState } from "../src/arcade/games/shell-song/engine";
const ready = (s: SongState) => { for (let i = 0; i < 3000 && s.phase === "watch"; i++) s = songStep(s, { type: "tick" }, 1 / 60); return s; };
function legacy(): ArcadeSave {
  const stars = Object.fromEntries(allLevelIds.filter(id => !/^w[456]/.test(id)).map(id => [id, 3])) as Record<LevelId, 3>;
  return { ...emptyArcade(), people: { family: { helper: true, games: { "shell-song": { ...emptyGameProgress(), stars, openWorlds: ["w1", "w2", "w3", "learn"], unlockedOutfits: openedOutfits(stars), outfit: "starlight", best: 123, coached: true } }, stickers: ["singing-shell"], rounds: ["old-round"], chest: null } } };
}
describe("feel v2 save compatibility", () => {
  it("strictly validates legacy bytes before migrating once, preserving progress and originals", () => {
    const old = legacy(), original = JSON.stringify(old);
    expect(validArcade(old)).toBe(true);
    const migrated = parseSave(JSON.stringify({ ...emptySave(), arcade: old })).arcade!;
    expect(migrated.people.family.helper).toBe(false); expect(migrated.people.family.helperDefaultV2).toBe(true);
    expect(migrated.people.family.games["shell-song"]!.stars).toEqual(old.people.family.games["shell-song"]!.stars);
    expect(migrated.people.family.games["shell-song"]!.openWorlds).toEqual(["w1", "w2", "w3", "w4", "w5", "learn"]);
    expect(migrated.people.family.stickers).toEqual(["singing-shell"]); expect(migrated.people.family.rounds).toEqual(["old-round"]);
    expect(migrated.people.family.games["shell-song"]!.best).toBe(123);
    expect(JSON.stringify(old)).toBe(original); expect(validArcade(migrated)).toBe(true); expect(migrateArcade(migrated)).toBe(migrated);
    const chosen = arcadeTransition(migrated, "family", { type: "helper", value: true });
    expect(parseSave(JSON.stringify({ ...emptySave(), arcade: chosen })).arcade!.people.family.helper).toBe(true);
    expect(emptyArcadeLearner().helper).toBe(false);
    expect(parseSave(JSON.stringify({ ...emptySave(), arcade: { ...old, people: { family: { ...old.people.family, helper: false } } } })).arcade!.people.family.helper).toBe(false);
  });
  it("rejects malformed flags, injected fields and invented gates without normalizing them away", () => {
    for (const flag of [false, 0, 1, "true", null]) {
      const bad = legacy(); Object.assign(bad.people.family, { helperDefaultV2: flag });
      expect(validArcade(bad)).toBe(false); expect(() => parseSave(JSON.stringify({ ...emptySave(), arcade: bad }))).toThrow(/original has been kept/);
    }
    const bad = legacy(); bad.people.family.games["shell-song"]!.openWorlds.push("w6"); expect(validArcade(bad)).toBe(false);
    const invented = legacy(); invented.people.family.games["shell-song"]!.stars["w4-1"] = 3; expect(validArcade(invented)).toBe(false);
    Object.assign(bad.people.family, { invincible: true }); expect(validArcade(bad)).toBe(false);
  });
  it("has 56 stable ids per game, exact six-world thresholds and palettes for every new world", () => {
    expect(allLevelIds).toHaveLength(56); expect(new Set(allLevelIds).size).toBe(56);
    expect(worldIds.map(w => worldStars[w])).toEqual([0, 12, 30, 50, 75, 100, 0]);
    for (const id of allLevelIds) expect(validLevelId(id)).toBe(true);
    for (const id of ["w0-1", "w7-1", "w6-0", "w4-9", "w4-01", "learn-9", "w4-1junk"]) expect(validLevelId(id)).toBe(false);
    for (const game of arcadeGames) {
      expect(game.worlds.map(w => w.id)).toEqual(worldIds);
      expect(game.worlds.filter(w => /^w[456]$/.test(w.id)).every(w => w.palette?.length === 3 && !!w.detail && !!w.name)).toBe(true);
    }
    for (const total of [0, 11, 12, 29, 30, 49, 50, 74, 75, 99, 100]) {
      const stars = Object.fromEntries(allLevelIds.slice(0, Math.floor(total / 3)).map(id => [id, 3]));
      if (total % 3) stars[allLevelIds[Math.floor(total / 3)]] = total % 3;
      expect(openedWorlds(stars as Record<LevelId, 3>)).toEqual(worldIds.filter(w => total >= worldStars[w]));
    }
  });
});
describe("lives and Shell Song reference", () => {
  it("spends one heart per hit, blocks hits for 1.2 seconds and ends at zero", () => {
    let lives = createLives(false); expect(lives.hearts).toBe(3); expect(createLives(true).hearts).toBe(5); expect(createLives(false, true).hearts).toBe(1);
    const original = JSON.stringify(lives); const hit = hitLives(lives); expect(hit.hearts).toBe(2); expect(hit.hit).toBe(1); expect(hitLives(hit)).toBe(hit); expect(JSON.stringify(lives)).toBe(original);
    lives = hit;
    for (let j = 0; j < 3; j++) { for (let i = 0; i < 73; i++) lives = stepLives(lives, 1 / 60); lives = hitLives(lives); }
    expect(lives.hearts).toBe(0); expect(lives.hit).toBe(3); expect(hitLives(lives)).toBe(lives); expect(validLives(lives)).toBe(true);
    expect(configureLives(hit, true).hearts).toBe(4); expect(configureLives(configureLives(hit, true), false).hearts).toBe(2);
    expect(configureLives(lives, true).hearts).toBe(0);
    for (const dt of [NaN, Infinity, -1, 0]) expect(stepLives(hit, dt)).toBe(hit);
    for (const v of [{ ...hit, hearts: -1 }, { ...hit, maxHearts: 999 }, { ...hit, invulnerable: Infinity }, { ...hit, hit: .5 }, { ...hit, extra: true }]) expect(validLives(v)).toBe(false);
  });
  it.each([false, true])("Helper=%s is finite; zero hearts returns game over and a new seed starts full hearts", helper => {
    let s = createSong(songLevel("w1-1"), 1, helper);
    for (let i = 0; i < (helper ? 5 : 3); i++) { s = ready(s); s = songTransition(s, { type: "shell", index: (s.pattern[0] + 1) % s.shells }); expect(validSong(s)).toBe(true); }
    expect(songResult(s)).toMatchObject({ cleared: false, outcome: "game-over", stars: 0 });
    expect(songStep(s, { type: "tick" }, 1 / 60)).toBe(s); // terminal snapshots must not continually cancel result delivery
    const retry = createSong(s.level, 100, helper); expect(retry.phase).toBe("watch"); expect(retry.lives.hearts).toBe(helper ? 5 : 3); expect(retry.seed).not.toBe(s.seed);
    const saved = arcadeTransition(legacy(), "family", { type: "finish", game: "shell-song", level: "w1-1", score: 400, stars: 0, round: "lost", name: "Family" });
    expect(saved.people.family.games["shell-song"]!.stars["w1-1"]).toBe(3); expect(saved.people.family.stickers).toEqual(["singing-shell"]); expect(saved.people.family.games["shell-song"]!.outfit).toBe("starlight"); expect(saved.people.family.games["shell-song"]!.best).toBe(400);
  });
  it("keeps reading untimed/unlimited and distinguishes voluntary free-play stopping", () => {
    let s = createSong(songLevel("learn-1"), 5, false);
    for (let i = 0; i < 7; i++) { s = ready(s); s = songTransition(s, { type: "shell", index: (s.pattern[0] + 1) % s.shells }); }
    expect(s.lives.hearts).toBe(3); expect(songResult(s)).toBeNull();
    expect(songResult(songTransition(createSong("endless", 5), { type: "finish" }))).toMatchObject({ outcome: "stopped", stars: 0 });
  });
});
