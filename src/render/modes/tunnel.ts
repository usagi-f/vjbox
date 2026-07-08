import { rnd, type VisualMode } from "../context";

interface Ring {
  r: number; hue: number; w: number; rot: number; sides: number; beat: boolean;
}

const rings: Ring[] = [];
let ringTimer = 0;

/** 多角形リングが迫ってくるトンネル */
export const tunnel: VisualMode = {
  id: "tunnel",
  label: "TUNNEL",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    ringTimer -= 1;
    if (a.beat || ringTimer <= 0) {
      rings.push({
        r: 8 * DPR,
        hue: f.hue() + rnd(-25, 25),
        w: (1 + (a.beat ? 3 * p.punch : 0.6)) * DPR,
        rot: f.rotAcc,
        sides: 3 + Math.floor(p.dens * 7),
        beat: a.beat,
      });
      ringTimer = Math.max(6, 30 - p.dens * 24);
    }
    cx.globalCompositeOperation = p.blend;
    const maxR = Math.hypot(W, H) * 0.6;
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r *= 1 + 0.012 + a.level * p.gain * 0.05 + (r.beat ? 0.01 : 0);
      r.rot += p.rot * 0.01;
      if (r.r > maxR) {
        rings.splice(i, 1);
        continue;
      }
      const fade = 1 - r.r / maxR;
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(r.rot);
      cx.strokeStyle = `hsla(${r.hue} 90% ${45 + fade * 25}% / ${fade})`;
      cx.lineWidth = r.w * (1 + a.beatEnv * p.punch);
      cx.beginPath();
      for (let s = 0; s <= r.sides; s++) {
        const ang = (s / r.sides) * Math.PI * 2;
        const wob = 1 + (freq[(s * 13) % 64] / 255 - 0.5) * 0.25 * p.gain;
        const x = Math.cos(ang) * r.r * wob;
        const y = Math.sin(ang) * r.r * wob;
        if (s) cx.lineTo(x, y); else cx.moveTo(x, y);
      }
      cx.closePath();
      cx.stroke();
      cx.restore();
    }
  },
};
