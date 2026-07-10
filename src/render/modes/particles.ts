import { rnd, type Frame, type VisualMode } from "../context";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; sz: number; hueOff: number;
}

const parts: Particle[] = [];

function spawn(f: Frame, count: number, burst: boolean): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const common = { life: 1, decay: rnd(0.004, 0.015), sz: rnd(1, 3.5) * f.DPR, hueOff: rnd(-40, 40) };
    if (f.p.vari === 2) {
      /* 噴水: 画面下から吹き上げる */
      const sp = (burst ? rnd(7, 15) : rnd(3, 8)) * f.DPR;
      parts.push({
        x: f.CX + rnd(-0.22, 0.22) * f.W,
        y: f.H + 8 * f.DPR,
        vx: rnd(-1.4, 1.4) * f.DPR,
        vy: -sp,
        ...common,
      });
    } else if (f.p.vari === 3) {
      /* リング放出: 円周上から接線方向に流れる */
      const R = Math.min(f.W, f.H) * 0.28;
      const sp = (burst ? rnd(2.5, 6) : rnd(0.8, 2.2)) * f.DPR;
      parts.push({
        x: f.CX + Math.cos(a) * R,
        y: f.CY + Math.sin(a) * R,
        vx: -Math.sin(a) * sp,
        vy: Math.cos(a) * sp,
        ...common,
      });
    } else {
      const sp = burst ? rnd(2, 9) * f.DPR : rnd(0.3, 1.6) * f.DPR;
      parts.push({
        x: f.CX + Math.cos(a) * rnd(0, 30 * f.DPR),
        y: f.CY + Math.sin(a) * rnd(0, 30 * f.DPR),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        ...common,
      });
    }
  }
}

/** ビートで爆ぜるパーティクル。vari: 1=渦 / 2=噴水 / 3=リング放出 */
export const particles: VisualMode = {
  id: "particles",
  label: "PRTCL",
  draw(f) {
    const { cx, W, H, CX, CY, a, p } = f;
    const cap = Math.floor(150 + p.dens * 650);
    if (parts.length < cap) spawn(f, Math.floor(1 + a.level * 10), false);
    if (a.beat) spawn(f, Math.floor(20 + p.punch * 90), true);

    const h0 = f.hue();
    const g = p.gain;
    const swirl = p.rot * 0.03;
    cx.globalCompositeOperation = p.blend;

    for (let i = parts.length - 1; i >= 0; i--) {
      const pt = parts[i];
      const dx = pt.x - CX, dy = pt.y - CY;
      if (p.vari === 2) {
        /* 重力で放物線を描く */
        pt.vy += 0.09 * f.DPR * (1 + a.bass * g * 0.5);
        pt.vx += -dy * swirl * 0.3;
      } else {
        pt.vx += (-dy * swirl - dx * 0.0004) * (1 + a.bass * g);
        pt.vy += (dx * swirl - dy * 0.0004) * (1 + a.bass * g);
      }
      pt.x += pt.vx * (1 + a.level * g * 1.5);
      pt.y += pt.vy * (1 + a.level * g * 1.5);
      pt.life -= pt.decay;
      if (pt.life <= 0 || pt.x < -50 || pt.x > W + 50 || pt.y < -50 || pt.y > H + 50) {
        parts.splice(i, 1);
      }
    }
    f.sym(() => {
      for (const pt of parts) {
        cx.fillStyle = `hsla(${h0 + pt.hueOff} 90% ${50 + pt.life * 25}% / ${pt.life * 0.8})`;
        cx.beginPath();
        cx.arc(pt.x, pt.y, pt.sz * (0.5 + pt.life * 0.8 + a.beatEnv * p.punch), 0, Math.PI * 2);
        cx.fill();
      }
    });
  },
};
