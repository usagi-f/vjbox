import { rnd, type Frame, type VisualMode } from "../context";

interface Shape {
  type: number; life: number; sc: number;
  rot: number; vr: number; sz: number;
  x: number; y: number; hueOff: number;
}

const shapes: Shape[] = [];

function newShape(f: Frame, big: boolean): Shape {
  return {
    type: Math.floor(Math.random() * 4),
    life: 1,
    sc: 1,
    rot: rnd(0, 6.28),
    vr: rnd(-0.02, 0.02),
    sz: big ? rnd(0.25, 0.55) : rnd(0.06, 0.18),
    x: f.CX + rnd(-0.28, 0.28) * f.W,
    y: f.CY + rnd(-0.28, 0.28) * f.H,
    hueOff: rnd(-50, 50),
  };
}

/** ビートで幾何学図形がフラッシュするクラブVJ定番 */
export const flash: VisualMode = {
  id: "flash",
  label: "FLASH",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    if (a.beat) {
      const n = 1 + Math.round(p.punch * 2);
      for (let i = 0; i < n; i++) shapes.push(newShape(f, true));
    }
    if (shapes.length < 4 + p.dens * 20 && Math.random() < a.treb * p.gain * 0.45) {
      shapes.push(newShape(f, false));
    }
    const h0 = f.hue();
    cx.globalCompositeOperation = p.blend;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      s.life -= 0.035;
      s.rot += s.vr + p.rot * 0.005;
      s.sc += 0.012 + a.level * 0.02;
      if (s.life <= 0) {
        shapes.splice(i, 1);
        continue;
      }
      const sz = s.sz * Math.min(W, H) * s.sc;
      cx.save();
      cx.translate(s.x, s.y);
      cx.rotate(s.rot);
      cx.strokeStyle = `hsla(${h0 + s.hueOff} 92% ${55 + s.life * 25}% / ${s.life})`;
      cx.lineWidth = (2 + s.life * 5) * DPR;
      cx.beginPath();
      if (s.type === 0) {
        cx.arc(0, 0, sz / 2, 0, Math.PI * 2);
      } else if (s.type === 1) {
        for (let k = 0; k <= 3; k++) {
          const ang = -Math.PI / 2 + (k * Math.PI * 2) / 3;
          const x = (Math.cos(ang) * sz) / 2;
          const y = (Math.sin(ang) * sz) / 2;
          if (k) cx.lineTo(x, y); else cx.moveTo(x, y);
        }
      } else if (s.type === 2) {
        cx.rect(-sz / 2, -sz / 2, sz, sz);
      } else {
        cx.moveTo(-sz / 2, 0);
        cx.lineTo(sz / 2, 0);
        cx.moveTo(0, -sz / 2);
        cx.lineTo(0, sz / 2);
      }
      cx.stroke();
      cx.restore();
    }
  },
};
