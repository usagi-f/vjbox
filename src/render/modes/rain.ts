import { rnd, type VisualMode } from "../context";

interface Drop { y: number; sp: number; }

const drops: Drop[] = [];

/** カタカナのデジタルレイン。残像がそのまま尾になる */
export const rain: VisualMode = {
  id: "rain",
  label: "RAIN",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const cols = Math.floor(24 + p.dens * 56);
    if (drops.length !== cols) {
      drops.length = 0;
      for (let i = 0; i < cols; i++) drops.push({ y: Math.random() * H, sp: rnd(2, 7) });
    }
    const colW = W / cols;
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
    cx.font = `${Math.ceil(colW * 0.9)}px monospace`;
    cx.textAlign = "center";
    for (let i = 0; i < cols; i++) {
      const d = drops[i];
      const fi = Math.floor(Math.pow(i / cols, 1.4) * freq.length * 0.5);
      const v = Math.min(1, (freq[fi] / 255) * g);
      d.y += d.sp * DPR * (0.5 + v * 2.5 + a.beatEnv * p.punch * 2);
      if (d.y > H + colW) {
        d.y = -rnd(0, H * 0.3);
        d.sp = rnd(2, 7);
      }
      const ch = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
      cx.fillStyle = `hsla(${h0 + v * 60} 90% ${55 + v * 30}% / ${0.45 + v * 0.55})`;
      cx.fillText(ch, i * colW + colW / 2, d.y);
    }
  },
};
