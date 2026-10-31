import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useIsFocused } from "expo-router";
import { Sheet } from "../components/ui";
import { useStore } from "../state/Store";
import { learnerPractice } from "../learn/learners";
import { PracticeSummary, validPracticeSummary } from "./types";
import { PracticePanel } from "./PracticePanel";

type Pending = { round: string; serial: number; epoch: number; snapshot: unknown; config: string; run: () => void; cancel?: () => void };
/** A single deferred new-round action, never a lock on an existing saved game. */
export function useRoundPractice(target: string, snapshot: unknown) {
  const store = useStore(), focused = useIsFocused();
  const settings = learnerPractice(store.save.learning, store.save.settings.practice);
  const config = JSON.stringify(settings);
  const [pending, setPending] = useState<Pending | null>(null);
  const [foreground, setForeground] = useState(AppState.currentState === "active" || AppState.currentState === null || Platform.OS === "web");
  const serial = useRef(0), pendingRef = useRef<Pending | null>(null), mounted = useRef(true);
  const live = useRef({ epoch: store.epoch, snapshot, config, focused, foreground, settings, store });
  useLayoutEffect(() => { live.current = { epoch: store.epoch, snapshot, config, focused, foreground, settings, store }; });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingRef.current = null; }; }, []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", s => setForeground(s === "active"));
    const visibility = () => setForeground(!document.hidden);
    if (Platform.OS === "web" && typeof document !== "undefined") document.addEventListener("visibilitychange", visibility);
    return () => {
      sub.remove();
      if (Platform.OS === "web" && typeof document !== "undefined") document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const current = useCallback((p: Pending) => {
    const v = live.current;
    return mounted.current && v.focused && v.epoch === p.epoch && v.snapshot === p.snapshot && v.config === p.config;
  }, []);
  const request = useCallback((run: () => void, cancel?: () => void) => {
    if (!mounted.current || !live.current.focused || pendingRef.current) return;
    const v = live.current;
    if (!v.settings.enabled) { run(); return; }
    const p = { round: `warmup-${Date.now().toString(36)}-${serial.current + 1}`, serial: ++serial.current, epoch: v.epoch, snapshot: v.snapshot, config: v.config, run, cancel };
    pendingRef.current = p; setPending(p);
  }, []);
  const cancel = useCallback(() => {
    const p = pendingRef.current;
    pendingRef.current = null; setPending(null);
    if (p && current(p)) p.cancel?.();
  }, [current]);
  useEffect(() => {
    if (pendingRef.current && !current(pendingRef.current)) {
      pendingRef.current = null;
      setPending(null);
    }
  }, [snapshot, config, focused, store.epoch, current]);
  const complete = (summary: PracticeSummary) => {
    const p = pendingRef.current;
    if (!p || !current(p) || !live.current.foreground || !validPracticeSummary(summary)) return;
    // Consume before any store write or child callback can rerender/reenter.
    pendingRef.current = null; setPending(null);
    for (const result of summary.results.slice(0, 3)) {
      live.current.store.notePractice(result.skill, result.helped, p.epoch);
      live.current.store.practice(result.skill, !result.helped);
    }
    if (!summary.bypassed) live.current.store.recordWarmup(summary.results, live.current.settings, p.round, p.epoch);
    p.run();
  };
  const visible = !!pending && focused && pending.epoch === store.epoch && pending.snapshot === snapshot && pending.config === config;
  const content = visible && pending ? <PracticePanel key={`${target}:${pending.serial}`} settings={settings} soundOn={store.save.settings.sound && (store.save.settings.narration ?? true)}
    active={focused && foreground} onComplete={complete} onCancel={cancel} /> : null;
  return {
    request,
    cancel,
    content,
    pending: visible,
    panel: <Sheet visible={visible} title="A little practice, then play" onClose={cancel}>
      {content}
    </Sheet>,
  };
}

export type RoundPractice = Pick<ReturnType<typeof useRoundPractice>, "pending" | "content" | "panel" | "cancel">;
