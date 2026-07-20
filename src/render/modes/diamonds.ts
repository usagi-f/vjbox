import type { VisualMode } from "../context";

/** 同心の回転スクエア。vari: 1=同心 / 2=交互回転 / 3=ダイヤタイル */
export const diamonds: VisualMode = {
  id: "diamonds",
  label: "DIAMD",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p, t } = f;
    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H) * 0.62;
    cx.globalCompositeOperation = p.blend;
    if (p.vari === 3) {
      /* 画面に敷き詰めた菱形タイルが帯域ごとに回転・明滅する */
      const cols = 8 + Math.floor(p.dens * 10);
      const rows = Math.max(5, Math.round((cols * H) / W));
      const cw = W / cols;
      const chh = H / rows;
      const base = Math.min(cw, chh) * 0.5;
      for (let i = 0; i < cols; i++) {
        const fi = Math.floor(Math.pow(i / cols, 1.5) * freq.length * 0.55);
        const v = Math.min(1, (freq[fi] / 255) * g);
        for (let j = 0; j < rows; j++) {
          /* 波が斜めに走るよう行ごとに位相をずらす */
          const ph = Math.sin(t * 0.05 + (i + j) * 0.7);
          const al = 0.1 + v * (0.35 + 0.55 * ph * ph);
          if (al < 0.12) continue;
          const sz = base * (0.45 + v * 0.75 + a.beatEnv * p.punch * 0.25);
          cx.save();
          cx.translate((i + 0.5) * cw, (j + 0.5) * chh);
          cx.rotate(f.rotAcc * ((i + j) % 2 === 0 ? 1.5 : -1.5) + v * 0.8);
          cx.strokeStyle = `hsla(${h0 + ((i + j) % 6) * 18 + v * 40} 90% ${45 + v * 30}% / ${al})`;
          cx.lineWidth = (1 + v * 2.5 + a.beatEnv * p.punch * 1.5) * DPR;
          cx.beginPath();
          cx.moveTo(0, -sz);
          cx.lineTo(sz, 0);
          cx.lineTo(0, sz);
          cx.lineTo(-sz, 0);
          cx.closePath();
          cx.stroke();
          cx.restore();
        }
      }
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
