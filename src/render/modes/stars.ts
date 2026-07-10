import { rnd, type VisualMode } from "../context";

interface Star {
  ang: number; dist: number; sp: number; hueOff: number; tw: number;
}

const field: Star[] = [];

function newStar(): Star {
  return {
    ang: Math.random() * Math.PI * 2,
    dist: rnd(0.02, 1),
    sp: rnd(0.004, 0.014),
    hueOff: rnd(-25, 25),
    tw: Math.random() * Math.PI * 2,
  };
}

/** 星空ワープ。vari: 1=流れる星 / 2=ワープライン / 3=きらめき */
export const stars: VisualMode = {
  id: "stars",
  label: "STARS",
  draw(f) {
    const { cx, W, H, DPR, a, p, t } = f;
    const cap = Math.floor(80 + p.dens * 320);
    while (field.length < cap) field.push(newStar());
    if (field.length > cap) field.length = cap;

    const h0 = f.hue();
    const g = p.gain;
    const maxR = Math.hypot(W, H) * 0.5;
    const speed = p.vari === 3 ? 0.12 : 1 + a.level * g * 4 + a.beatEnv * p.punch * 3;
    cx.globalCompositeOperation = p.blend;
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc * 0.25);
    for (const s of field) {
      s.dist *= 1 + s.sp * speed;
      if (s.dist > 1.1) Object.assign(s, newStar(), { dist: rnd(0.02, 0.1) });
      const r = s.dist * s.dist * maxR;
      const x = Math.cos(s.ang) * r;
      const y = Math.sin(s.ang) * r;
      const bright = Math.min(1, s.dist * 1.6);
      if (p.vari === 2) {
        /* 奥から伸びるワープライン */
        const r0 = Math.max(0, r - r * (0.18 + a.level * g * 0.3));
        cx.strokeStyle = `hsla(${h0 + s.hueOff} 85% ${55 + bright * 25}% / ${bright * 0.9})`;
        cx.lineWidth = (0.6 + s.dist * 2.4) * DPR;
        cx.beginPath();
        cx.moveTo(Math.cos(s.ang) * r0, Math.sin(s.ang) * r0);
        cx.lineTo(x, y);
        cx.stroke();
      } else if (p.vari === 3) {
        /* ほぼ静止してきらめく星々 */
        const twk = 0.5 + 0.5 * Math.sin(t * 0.12 + s.tw * 7);
        const sz = (0.6 + s.dist * 1.6 + twk * 1.4 + a.treb * g * 2.5) * DPR;
        cx.fillStyle = `hsla(${h0 + s.hueOff} 85% ${55 + twk * 30}% / ${0.35 + twk * 0.6})`;
        cx.beginPath();
        cx.arc(x, y, sz, 0, Math.PI * 2);
        cx.fill();
      } else {
        cx.fillStyle = `hsla(${h0 + s.hueOff} 85% ${55 + bright * 30}% / ${bright})`;
        cx.beginPath();
        cx.arc(x, y, (0.5 + s.dist * 2.2 + a.beatEnv * p.punch) * DPR, 0, Math.PI * 2);
        cx.fill();
      }
    }
    cx.restore();
  },
};
