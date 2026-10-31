export type Commands<I> = { helper: boolean; serial?: number; queue: { id: number; action: I }[] };
/** Called only on UI (including JS callers scheduled onto UI). Never overwrite a stale JS copy. */
export function enqueueCommand<I>(box: Commands<I>, action: I): Commands<I> {
  "worklet";
  const id = (box.serial ?? box.queue[box.queue.length - 1]?.id ?? 0) + 1;
  return { helper: box.helper, serial: id, queue: [...box.queue.slice(-31), { id, action }] };
}
export function drainCommands<I>(box: Commands<I>, state: { command: number }): Commands<I> {
  "worklet";
  if (!box.queue.length || box.queue[0].id > state.command) return box;
  return { ...box, queue: box.queue.filter(cmd => cmd.id > state.command) };
}
