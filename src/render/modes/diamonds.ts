import { rnd, type VisualMode } from "../context";

interface Sq { fr: number; hue: number; rot: number; }

const flying: Sq[] = [];
let spawnTimer = 0;

/** 同心の回転スクエア。vari: 1=同心 / 2=交互回転 / 3=スクエアトンネル */
export const diamonds: VisualMode = {
  id: "diamonds",
  label: "DIAMD",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H) * 0.62;
    cx.globalCompositeOperation = p.blend;
    if (p.vari === 3) {
      /* 中心から湧いて手前に飛んでくるスクエアのトンネル */
      spawnTimer -= 1;
      if (a.beat || spawnTimer <= 0) {
        flying.push({ fr: 0.03, hue: h0 + rnd(-30, 30), rot: rnd(-0.4, 0.4) });
        spawnTimer = Math.max(5, 24 - p.dens * 18);
      }
      f.sym(() => {
        cx.save();
        cx.translate(f.CX, f.CY);
        for (let i = flying.length - 1; i >= 0; i--) {
          const s = flying[i];
          s.fr *= 1 + 0.022 + a.level * g * 0.05 + a.beatEnv * p.punch * 0.02;
          if (s.fr > 1.5) {
            flying.splice(i, 1);
            continue;
          }
          const sz = s.fr * Math.hypot(W, H) * 0.8;
          const fade = 1 - s.fr / 1.5;
          cx.save();
          cx.rotate(f.rotAcc + s.rot + s.fr * 1.2 + Math.PI / 4);
          cx.strokeStyle = `hsla(${s.hue} 90% ${45 + fade * 30}% / ${fade})`;
          cx.lineWidth = (1 + s.fr * 4 + a.beatEnv * p.punch * 2) * DPR;
          cx.strokeRect(-sz / 2, -sz / 2, sz, sz);
          cx.restore();
        }
        cx.restore();
      });
      return;
    }
    const n = Math.floor(6 + p.dens * 16);
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      for (let i = n - 1; i >= 0; i--) {
        const fr = (i + 1) / n;
        const fi = Math.floor(fr * freq.length * 0.5);
        const v = Math.min(1, (freq[fi] / 255) * g);
        const sz = F * fr * (1 + v * 0.18 + a.beatEnv * p.punch * 0.1);
        cx.save();
        const dir = p.vari === 2 && i % 2 === 1 ? -1 : 1;
        cx.rotate(f.rotAcc * dir + (p.vari === 2 ? 0 : fr * 0.5) + Math.PI / 4);
        cx.strokeStyle = `hsla(${h0 + fr * 90} 90% ${45 + v * 30}% / ${0.25 + v * 0.6})`;
        cx.lineWidth = (1 + v * 3.5 + a.beatEnv * p.punch * 2) * DPR;
        cx.strokeRect(-sz / 2, -sz / 2, sz, sz);
        cx.restore();
      }
      cx.restore();
    });
  },
};
