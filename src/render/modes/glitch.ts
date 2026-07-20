import { rnd, type VisualMode } from "../context";

/** スペクトルのスライス + 色収差ずらし。vari: 1=水平 / 2=垂直 / 3=ブロックノイズ */
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
    if (p.vari === 2) {
      /* 縦スライス: 上下ジッター */
      const bw = W / bands;
      for (let i = 0; i < bands; i++) {
        const fi = Math.floor(Math.pow(i / bands, 1.3) * freq.length * 0.5);
        const v = Math.min(1, (freq[fi] / 255) * g);
        if (v < 0.05) continue;
        const jitter = (Math.random() - 0.5) * H * 0.3 * v * (0.4 + a.beatEnv * p.punch * 1.6);
        const hBar = v * H * 0.85;
        const x = i * bw + bw * 0.18;
        const ww = bw * 0.64;
        const y = f.CY - hBar / 2 + jitter;
        const split = (3 + v * 14 + a.beatEnv * p.punch * 18) * DPR;
        cx.fillStyle = `hsla(${(h0 + 300) % 360} 90% 55% / .35)`;
        cx.fillRect(x, y - split, ww, hBar);
        cx.fillStyle = `hsla(${(h0 + 60) % 360} 90% 55% / .35)`;
        cx.fillRect(x, y + split, ww, hBar);
        cx.fillStyle = `hsla(${h0} 90% 65% / .6)`;
        cx.fillRect(x, y, ww, hBar);
      }
    } else if (p.vari === 3) {
      /* ランダム矩形が散るブロックノイズ */
      const blocks = Math.floor(6 + p.dens * 26 + a.level * g * 20);
      for (let i = 0; i < blocks; i++) {
        const fi = Math.floor(Math.random() * freq.length * 0.5);
        const v = Math.min(1, (freq[fi] / 255) * g);
        if (v < 0.08) continue;
        const bw = W * rnd(0.03, 0.16) * (0.6 + v);
        const bhh = H * rnd(0.01, 0.05) * (0.6 + v);
        const x = Math.random() * (W - bw);
        const y = Math.random() * (H - bhh);
        const split = (2 + v * 10 + a.beatEnv * p.punch * 14) * DPR;
        cx.fillStyle = `hsla(${(h0 + 300) % 360} 90% 55% / .3)`;
        cx.fillRect(x - split, y, bw, bhh);
        cx.fillStyle = `hsla(${(h0 + 60) % 360} 90% 55% / .3)`;
        cx.fillRect(x + split, y, bw, bhh);
        cx.fillStyle = `hsla(${h0} 90% ${55 + v * 25}% / ${0.35 + v * 0.4})`;
        cx.fillRect(x, y, bw, bhh);
      }
    } else {
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
    }
    if (a.beat && Math.random() < p.punch) {
      cx.fillStyle = `hsla(${h0} 30% 92% / .22)`;
      cx.fillRect(0, Math.random() * H, W, rnd(2, 10) * DPR);
    }
  },
};
