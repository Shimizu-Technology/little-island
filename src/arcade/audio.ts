import { createAudioPlayer, useAudioPlayer, type AudioPlayer } from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import { useSoundControls } from "../components/Audio";
import { feel } from "../components/feel";
import type { Settings } from "../state/validation";
import type { ArcadeId } from "./types";
const tones: Record<string, number> = {
  "run-jump": require("../../assets/arcade/shell-3.wav"),
  "run-roll": require("../../assets/arcade/shell-1.wav"),
  "run-lane": require("../../assets/audio/tap.wav"),
  "run-hazard": require("../../assets/arcade/shell-0.wav"),
  "run-magnet": require("../../assets/arcade/shell-5.wav"),
  "run-kite": require("../../assets/arcade/sticker.wav"),
  "run-sandals": require("../../assets/arcade/shell-4.wav"),
  "run-shield": require("../../assets/arcade/coral.wav"),
  // Reuse the bundled dry tap for rail contact; wall callbacks always disable haptics.
  wall: require("../../assets/audio/tap.wav"),
  bump: require("../../assets/arcade/shell-0.wav"), coral: require("../../assets/arcade/coral.wav"), clear: require("../../assets/arcade/clear.wav"), sticker: require("../../assets/arcade/sticker.wav"),
  "shell-0": require("../../assets/arcade/shell-0.wav"), "shell-1": require("../../assets/arcade/shell-1.wav"), "shell-2": require("../../assets/arcade/shell-2.wav"), "shell-3": require("../../assets/arcade/shell-3.wav"), "shell-4": require("../../assets/arcade/shell-4.wav"), "shell-5": require("../../assets/arcade/shell-5.wav"),
};
const musicSources = { reef: require("../../assets/arcade/reef-loop.wav"), song: require("../../assets/arcade/song-loop.wav") };
export function useArcadeAudio(game: ArcadeId, settings: Settings, music: boolean, active: boolean, sheetOpen = false) {
  // One preloaded player per effect. Swapping sources with replace() reloads the asset on the
  // main thread and stalled the frame on every flap/hop; rewinding a loaded player does not.
  const [effects] = useState<Record<string, AudioPlayer>>(() => Object.fromEntries(Object.entries(tones).map(([key, source]) => [key, createAudioPlayer(source)])));
  useEffect(() => () => { for (const player of Object.values(effects)) { try { player.remove(); } catch { /* Already released. */ } } }, [effects]);
  const loop = useAudioPlayer(game === "shell-song" ? musicSources.song : musicSources.reef);
  const speech = useSoundControls(settings.sound && active);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- SDK AudioPlayer properties intentionally mutate its native handle.
    loop.loop = true; loop.volume = .2;
    try { if (active && !sheetOpen && music && settings.sound) loop.play(); else loop.pause(); } catch { /* Browser playback may need the next touch. */ }
    return () => { try { loop.pause(); } catch { /* Unmounted player. */ } };
  }, [loop, music, settings.sound, active, sheetOpen]);
  useEffect(() => { if (!active || sheetOpen || !settings.sound || settings.effects === false) { for (const player of Object.values(effects)) { try { player.pause(); } catch { /* Disposed player. */ } } } }, [effects, settings.sound, settings.effects, active, sheetOpen]);
  const tone = useCallback((key: string, haptic = true) => {
    if (!active || sheetOpen) return;
    if (haptic) feel(key === "clear" || key === "sticker" ? "success" : "select");
    if (!settings.sound || settings.effects === false || !tones[key]) return;
    const player = effects[key];
    try { void player.seekTo(0); player.play(); } catch { /* Visible feedback always accompanies a sound. */ }
  }, [effects, settings.sound, settings.effects, active, sheetOpen]);
  const say = useCallback((key: string, automatic = false) => { const played = speech.play(key, automatic); return played; }, [speech]);
  return { tone, say, stop: speech.stop };
}
