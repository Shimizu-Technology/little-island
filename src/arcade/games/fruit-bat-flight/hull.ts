/** Logical arena units. Ears, wing membranes and the nose tip are decorative. */
export const FLIGHT_W = 390, FLIGHT_H = 660, BAT_RX = 23, BAT_RY = 22, TRUNK_HALF = 14, CEILING = 10, GROUND = 650;
export function batAngle(vy: number) { "worklet"; return Math.max(-.436, Math.min(1.134, vy * 1.4)); }
export function batExtentX(angle: number) { "worklet"; return Math.hypot(BAT_RX * Math.cos(angle), BAT_RY * Math.sin(angle)); }
export function batExtentY(angle: number) { "worklet"; return Math.hypot(BAT_RX * Math.sin(angle), BAT_RY * Math.cos(angle)); }
/** Exact ellipse vs rectangle: transform its edges into the ellipse's unit circle. */
export function batTouchesRect(cx: number, cy: number, angle: number, left: number, top: number, right: number, bottom: number) {
  "worklet";
  if (cx >= left && cx <= right && cy >= top && cy <= bottom) return true;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const corners = [[left,top],[right,top],[right,bottom],[left,bottom]].map(([x,y]) => [(cos*(x-cx)+sin*(y-cy))/BAT_RX, (-sin*(x-cx)+cos*(y-cy))/BAT_RY]);
  for (let i=0;i<4;i++) {
    const a=corners[i],b=corners[(i+1)%4],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dy)/(dx*dx+dy*dy || 1)));
    if ((a[0]+t*dx)**2+(a[1]+t*dy)**2 <= 1+1e-10) return true;
  }
  return false;
}
export function batTouchesGate(y: number, vy: number, gateX: number, center: number, gap: number) {
  "worklet";
  if (Math.abs(gateX*FLIGHT_W-.24*FLIGHT_W) > BAT_RX+TRUNK_HALF) return false;
  const cx=.24*FLIGHT_W,cy=y*FLIGHT_H,angle=batAngle(vy),left=gateX*FLIGHT_W-TRUNK_HALF,right=gateX*FLIGHT_W+TRUNK_HALF;
  return batTouchesRect(cx,cy,angle,left,-FLIGHT_H,right,(center-gap/2)*FLIGHT_H) || batTouchesRect(cx,cy,angle,left,(center+gap/2)*FLIGHT_H,right,FLIGHT_H*2);
}
