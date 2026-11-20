/** Classroom board (2.7): draws elements on a 2D canvas whose transform is already in board units. */
import { LASER_MS, MARKER_W, PEN_W, bounds, isRtl, type BoardEl } from './model';

export const BOARD_FONT = "'Thmanyah Sans', 'IBM Plex Sans Arabic', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
const LASER = '#C51F24';

/** Smooth path through the points (quadratic midpoints), the same curve as the slide pen. */
function smooth(ctx: CanvasRenderingContext2D, p: number[]) {
  ctx.beginPath();
  ctx.moveTo(p[0], p[1]);
  if (p.length <= 2) { ctx.lineTo(p[0] + 0.1, p[1]); return; }
  for (let i = 2; i < p.length - 2; i += 2) ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
  ctx.lineTo(p[p.length - 2], p[p.length - 1]);
}

export function drawEl(ctx: CanvasRenderingContext2D, e: BoardEl) {
  if (e.isDeleted || e.type === 'laser' || !Array.isArray(e.pts)) return;
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = e.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = PEN_W;
  const [x1, y1, x2, y2] = e.pts;
  switch (e.type) {
    case 'stroke':
      if (e.tool === 'marker') { ctx.globalAlpha = 0.35; ctx.lineWidth = MARKER_W; }
      smooth(ctx, e.pts);
      ctx.stroke();
      break;
    case 'line':
    case 'arrow': {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      if (e.type === 'arrow') {
        const a = Math.atan2(y2 - y1, x2 - x1);
        for (const s of [-0.45, 0.45]) { ctx.moveTo(x2, y2); ctx.lineTo(x2 - 18 * Math.cos(a + s), y2 - 18 * Math.sin(a + s)); }
      }
      ctx.stroke();
      break;
    }
    case 'rect':
      ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      break;
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    case 'text': {
      const rtl = isRtl(e.text);
      ctx.font = `${e.size}px ${BOARD_FONT}`;
      ctx.textBaseline = 'top';
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left';
      e.text.split('\n').forEach((line, i) => ctx.fillText(line, x1, y1 + i * e.size * 1.3));
      break;
    }
  }
  ctx.restore();
}

/** The laser trail: newest point brightest, the whole trail fading with its age. */
export function drawLaser(ctx: CanvasRenderingContext2D, pts: number[], ageMs: number) {
  const fade = Math.max(0, 1 - ageMs / LASER_MS);
  const n = pts.length / 2;
  ctx.save();
  ctx.fillStyle = LASER;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = fade * ((i + 1) / n) * 0.85;
    ctx.beginPath();
    ctx.arc(pts[2 * i], pts[2 * i + 1], 2 + (i / n) * 5, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSelection(ctx: CanvasRenderingContext2D, e: BoardEl) {
  const b = bounds(e);
  ctx.save();
  ctx.strokeStyle = '#087D91';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.strokeRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16);
  ctx.restore();
}

export function drawEraser(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,253,247,0.6)';
  ctx.strokeStyle = '#1E1410';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
