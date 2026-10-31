import { useRef, useState } from "react";
import { homeReducer, starterHome, migrateHome, type HomeResult, type HomeAction, type HomeStateV2, type Ownership } from "./model";
export type History = { present: HomeStateV2; past: HomeStateV2[]; future: HomeStateV2[] };
export function editHistory(
  history: History,
  action: HomeAction | { type: "undo" | "redo" },
  ownership: Ownership = {},
  computed?:HomeResult
): History {
  if (action.type === "undo")
    return history.past.length
      ? {
          present: history.past.at(-1)!.current===history.present.current?history.past.at(-1)!:{...history.past.at(-1)!,current:history.present.current},
          past: history.past.slice(0, -1),
          future: [history.present, ...history.future].slice(0, 40),
        }
      : history;
  if (action.type === "redo")
    return history.future.length
      ? {
          present: history.future[0].current===history.present.current?history.future[0]:{...history.future[0],current:history.present.current},
          past: [...history.past, history.present].slice(-40),
          future: history.future.slice(1),
        }
      : history;
  const result = computed ?? homeReducer(history.present, action as HomeAction, ownership);
  return result.state === history.present
    ? history
    : action.type === "room" ? {...history,present:result.state} : { present: result.state, past: [...history.past, history.present].slice(-40), future: [] };
}
/** Settled-action adapter. The route supplies a learner-scoped Store transaction; never write around Store.commit.
 * Invalid initial input is exposed verbatim as recoveryOriginal and never overwritten.
 * Persist only HomeStateV2 through learner-scoped personalization, not session history. */
export function useHomeStore(ownership: Ownership = {}, initial?: unknown, persist?: (state: HomeStateV2) => boolean) {
  const [session, setSession] = useState(() => ({
    history: { present: migrateHome(initial) ?? starterHome(), past: [], future: [] } as History,
    message: "Your own little place by the sea.",
  }));
  const live = useRef(session);
  const dispatch = (action: HomeAction | { type: "undo" | "redo" }) => {
    const current = live.current;
    if (initial !== undefined && !migrateHome(initial)) { setSession({ ...current, message: "This room needs recovery before it can be changed." }); return; }
    const result = action.type !== "undo" && action.type !== "redo" ? homeReducer(current.history.present, action as HomeAction, ownership) : undefined;
    const history = editHistory(current.history, action, ownership,result);
    if (history !== current.history && persist && !persist(history.present)) {
      const next = { ...current, message: "Your room could not be updated. Please try again." };
      live.current = next; setSession(next); return;
    }
    const next = { history, message: result?.message ?? (action.type === "undo" ? "Undone." : action.type === "redo" ? "Redone." : "Room updated.") };
    live.current = next; setSession(next);
  };
  const setMessage = (message: string) => { const next = { ...live.current, message }; live.current = next; setSession(next); };
  return {
    state: session.history.present,
    dispatch,
    message: session.message,
    setMessage,
    canUndo: session.history.past.length > 0,
    canRedo: session.history.future.length > 0,
    recoveryOriginal: initial !== undefined && !migrateHome(initial) ? initial : undefined,
    persistence: persist ? "store" as const : "session" as const,
  };
}
