import { rnd, type VisualMode } from "../context";

/** スペクトルの水平スライス + 色収差ずらし */
export const glitch: VisualMode = {
  id: "glitch",
  label: "GLITCH",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const bands = 8 + Math.floor(p.dens * 20);
    const bh = H / bands;
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
    for (let i = 0; i < bands; i++) {
      const fi = Math.floor(Math.pow(i / bands, 1.3) * freq.length * 0.5);
      const v = Math.min(1, (freq[fi] / 255) * g);
      if (v < 0.05) continue;
      const jitter = (Math.random() - 0.5) * W * 0.3 * v * (0.4 + a.beatEnv * p.punch * 1.6);
      const wBar = v * W * 0.85;
      const y = i * bh + bh * 0.18;
      const hh = bh * 0.64;
      const x = f.CX - wBar / 2 + jitter;
      const split = (3 + v * 14 + a.beatEnv * p.punch * 18) * DPR;
      cx.fillStyle = `hsla(${(h0 + 300) % 360} 90% 55% / .35)`;
      cx.fillRect(x - split, y, wBar, hh);
      cx.fillStyle = `hsla(${(h0 + 60) % 360} 90% 55% / .35)`;
      cx.fillRect(x + split, y, wBar, hh);
      cx.fillStyle = `hsla(${h0} 90% 65% / .6)`;
      cx.fillRect(x, y, wBar, hh);
    }
    if (a.beat && Math.random() < p.punch) {
      cx.fillStyle = `hsla(${h0} 30% 92% / .22)`;
      cx.fillRect(0, Math.random() * H, W, rnd(2, 10) * DPR);
    }
  },
};
