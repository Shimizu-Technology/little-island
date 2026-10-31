import { createAudioPlayer, useAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { sources as baseSources } from "../content/audioSources";
import { learnSources } from "../content/learnAudio";
import { voiceSources } from "../content/neuralAudio";
import type { Settings } from "../state/validation";
import { feel, toneFeel } from "./feel";
export const AudioPreferences = createContext<Partial<Settings> & { epoch?: number }>({});
const sources: Record<string, number> = { ...baseSources, ...learnSources };
// expo-audio's web player calls HTMLMediaElement.play() without handling its promise. A quick
// second tone can reject with AbortError; autoplay policy can reject with NotAllowedError.
// Both are expected media failures: visible instructions and feedback remain available.
if (Platform.OS === "web" && typeof window !== "undefined")
  window.addEventListener("unhandledrejection", (event) => {
    if ((event.reason as { name?: string } | undefined)?.name && ["AbortError", "NotAllowedError"].includes(event.reason.name)) event.preventDefault();
  });
export function useSoundControls(enabled: boolean) {
  const player = useAudioPlayer(null);
  // Short feedback tones get their own preloaded players: replace() reloads an asset on the main
  // thread and caused a visible stall on every tap. Spoken lines still share the narration player.
  const [tonePlayers] = useState<Record<string, AudioPlayer>>(() => Object.fromEntries(Object.keys(toneFeel).filter(key => sources[key]).map(key => [key, createAudioPlayer(sources[key])])));
  useEffect(() => () => { for (const p of Object.values(tonePlayers)) { try { p.remove(); } catch { /* Already released. */ } } }, [tonePlayers]);
  // Cancellation (stop, settings change, background, disable) must silence tones as well as speech.
  const silence = useCallback(() => {
    try { player.pause(); } catch { /* Native player may already be disposed. */ }
    for (const p of Object.values(tonePlayers)) { try { p.pause(); } catch { /* Already released. */ } }
  }, [player, tonePlayers]);
  const prefs = useContext(AudioPreferences);
  const context = useMemo(() => ({ enabled, narration: prefs.narration ?? true, effects: prefs.effects ?? true, automatic: prefs.automaticSpeech ?? false, volume: prefs.narrationVolume ?? 0.75, voice: prefs.voice ?? "warm", epoch: prefs.epoch ?? 0 }), [enabled, prefs.narration, prefs.effects, prefs.automaticSpeech, prefs.narrationVolume, prefs.voice, prefs.epoch]);
  const live = useRef<typeof context | null>(context);
  useLayoutEffect(() => {
    live.current = context;
    silence();
    return () => { live.current = null; silence(); };
  }, [context, silence]);
  const foreground = useRef(AppState.currentState === "active" || Platform.OS === "web");
  useEffect(() => {
    const pause = silence;
    const sub = AppState.addEventListener("change", state => {
      foreground.current = state === "active";
      if (!foreground.current) pause();
    });
    const visibility = () => { foreground.current = !document.hidden; if (document.hidden) pause(); };
    if (Platform.OS === "web" && typeof document !== "undefined") document.addEventListener("visibilitychange", visibility);
    return () => {
      sub.remove();
      if (Platform.OS === "web" && typeof document !== "undefined") document.removeEventListener("visibilitychange", visibility);
    };
  }, [silence]);
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!enabled) silence();
  }, [enabled, silence]);
  const play = useCallback(
    // eslint-disable-next-line react-hooks/immutability -- Expo AudioPlayer is a native object with documented mutable properties.
    (key: string, automatic = false) => {
      // Feedback tones also give a light haptic, even with sound off.
      if (live.current === context && foreground.current && toneFeel[key]) feel(toneFeel[key]);
      const tone = !!toneFeel[key];
      if (live.current !== context || !context.enabled || !foreground.current || (tone ? !context.effects : !context.narration || (automatic && !context.automatic))) return false;
      const source = tone ? sources[key] : (voiceSources[context.voice][key] ?? sources[key]);
      if (!source) return false;
      try {
        if (tone && tonePlayers[key]) {
          const effect = tonePlayers[key];
          void effect.seekTo(0);
          effect.play();
          return true;
        }
        // eslint-disable-next-line react-hooks/immutability -- Native AudioPlayer volume is set through this SDK property.
        player.volume = tone ? 1 : context.volume;
        player.replace(source);
        player.play();
        return true;
      } catch {
        /* All spoken instructions remain visible as text. */
        return false;
      }
    },
    [context, player, tonePlayers]
  );
  const stop = silence;
  return { play, stop, player };
}

export function useSounds(enabled: boolean) { return useSoundControls(enabled).play; }
