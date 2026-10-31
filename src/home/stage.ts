/**
 * Scene width for the Island Home stage. Portrait shows a life-sized stage at least the
 * viewport wide and scrolls sideways; landscape fits the available height so the whole
 * floor stays reachable without vertical scrolling.
 */
export function stageWidth(viewport: { width: number; height: number }, drawerWidth: number, availableHeight: number, sceneUnits: number): number {
  const fit = Math.max(0, availableHeight) * 800 / sceneUnits, room = Math.max(0, viewport.width - drawerWidth);
  return Math.max(0, viewport.width > viewport.height ? Math.min(room, fit) : Math.max(room, fit));
}
