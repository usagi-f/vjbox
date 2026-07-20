import { rnd, type VisualMode } from "../context";

interface Drop { y: number; sp: number; }

const drops: Drop[] = [];

/** カタカナのデジタルレイン。vari: 1=カタカナ落下 / 2=バイナリ上昇 / 3=光の筋 */
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
      const step = d.sp * DPR * (0.5 + v * 2.5 + a.beatEnv * p.punch * 2);
      if (p.vari === 2) {
        /* 0/1 が下から上へ立ち上る */
        d.y -= step;
        if (d.y < -colW) {
          d.y = H + rnd(0, H * 0.3);
          d.sp = rnd(2, 7);
        }
        cx.fillStyle = `hsla(${h0 + v * 60} 90% ${55 + v * 30}% / ${0.45 + v * 0.55})`;
        cx.fillText(Math.random() < 0.5 ? "0" : "1", i * colW + colW / 2, d.y);
      } else if (p.vari === 3) {
        /* 文字なしの流星ストリーク */
        d.y += step * 1.6;
        if (d.y > H + colW * 4) {
          d.y = -rnd(0, H * 0.3);
          d.sp = rnd(2, 7);
        }
        const len = colW * (2 + v * 5);
        const grad = cx.createLinearGradient(0, d.y - len, 0, d.y);
        grad.addColorStop(0, `hsla(${h0 + v * 60} 90% 55% / 0)`);
        grad.addColorStop(1, `hsla(${h0 + v * 60} 90% ${60 + v * 25}% / ${0.6 + v * 0.4})`);
        cx.fillStyle = grad;
        cx.fillRect(i * colW + colW * 0.4, d.y - len, colW * 0.2, len);
      } else {
        d.y += step;
        if (d.y > H + colW) {
          d.y = -rnd(0, H * 0.3);
          d.sp = rnd(2, 7);
        }
        const ch = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
        cx.fillStyle = `hsla(${h0 + v * 60} 90% ${55 + v * 30}% / ${0.45 + v * 0.55})`;
        cx.fillText(ch, i * colW + colW / 2, d.y);
      }
    }
  },
};
