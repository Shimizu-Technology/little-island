let sequence = 0;
export function recoveryKey() {
  return `recovery-${Date.now()}-${++sequence}-${Math.random().toString(36).slice(2, 10)}`;
}
