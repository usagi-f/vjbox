import type { VisualMode } from "../context";

/** 画面を横切るDNA風二重らせん。vari: 1=二本鎖 / 2=三本鎖 / 3=粒子鎖 */
export const helix: VisualMode = {
  id: "helix",
  label: "HELIX",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p, t } = f;
    const strands = p.vari === 2 ? 3 : 2;
    const steps = Math.floor(60 + p.dens * 120);
    const h0 = f.hue();
    const g = p.gain;
    const amp = H * 0.18 * (1 + a.beatEnv * p.punch * 0.4);
    const phase = t * 0.03 * (1 + Math.abs(p.rot) * 2);
    const twist = 2.5 + p.dens * 3;
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc * 0.3);
      cx.translate(-f.CX, -f.CY);
      const ys: number[][] = [];
      for (let s = 0; s < strands; s++) {
        const off = (s * Math.PI * 2) / strands;
        const row: number[] = [];
        if (p.vari !== 3) {
          cx.strokeStyle = `hsla(${h0 + s * 50} 90% 60% / .85)`;
          cx.lineWidth = (1.6 + a.level * g * 2.5) * DPR;
          cx.beginPath();
        }
        for (let i = 0; i <= steps; i++) {
          const fr = i / steps;
          const fi = Math.floor(fr * freq.length * 0.5);
          const v = (freq[fi] / 255) * g;
          const x = fr * W;
          const y = f.CY + Math.sin(fr * Math.PI * 2 * twist + phase + off) * amp * (0.6 + v * 0.8);
          row.push(y);
          if (p.vari === 3) {
            /* 光る粒を鎖状に並べる */
            const depth = 0.5 + 0.5 * Math.cos(fr * Math.PI * 2 * twist + phase + off);
            cx.fillStyle = `hsla(${h0 + s * 50 + v * 40} 90% ${45 + depth * 30}% / ${0.35 + depth * 0.6})`;
            cx.beginPath();
            cx.arc(x, y, (1 + depth * 2.5 + v * 3) * DPR, 0, Math.PI * 2);
            cx.fill();
          } else if (i) {
            cx.lineTo(x, y);
          } else {
            cx.moveTo(x, y);
          }
        }
        if (p.vari !== 3) cx.stroke();
        ys.push(row);
      }
      /* 鎖同士を結ぶ横木 */
      if (p.vari !== 3) {
        const rungEvery = Math.max(3, Math.floor(steps / (8 + p.dens * 18)));
        cx.lineWidth = (0.9 + a.beatEnv * p.punch * 1.5) * DPR;
        for (let i = 0; i <= steps; i += rungEvery) {
          const x = (i / steps) * W;
          cx.strokeStyle = `hsla(${h0 + 90} 85% 60% / .45)`;
          cx.beginPath();
          cx.moveTo(x, ys[0][i]);
          cx.lineTo(x, ys[1][i]);
          cx.stroke();
        }
      }
      cx.restore();
    });
  },
};
