import type { VisualMode } from "../context";

/** 全面EQタワーの壁。vari: 1=下から / 2=中央対称 / 3=セル明滅 */
export const grid: VisualMode = {
  id: "grid",
  label: "GRID",
  draw(f) {
    const { cx, W, H, freq, a, p, t } = f;
    const cols = Math.floor(14 + p.dens * 26);
    const rows = Math.max(6, Math.floor((cols * H) / W));
    const cw = W / cols;
    const ch = H / rows;
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc * 0.12);
    const sc = 1 + a.beatEnv * p.punch * 0.05;
    cx.scale(sc, sc);
    cx.translate(-f.CX, -f.CY);
    for (let i = 0; i < cols; i++) {
      const fi = Math.floor(Math.pow(i / cols, 1.7) * freq.length * 0.6);
      const v = Math.min(1, (freq[fi] / 255) * g);
      if (p.vari === 2) {
        /* 中央から上下対称に伸びる */
        const half = Math.floor(rows / 2);
        const lit = Math.floor(v * half);
        for (let j = 0; j < lit; j++) {
          const frac = j / half;
          cx.fillStyle = `hsla(${h0 + frac * 80} 90% ${38 + frac * 30}% / ${0.22 + frac * 0.55})`;
          cx.fillRect(i * cw + cw * 0.14, f.CY - (j + 1) * ch + ch * 0.14, cw * 0.72, ch * 0.72);
          cx.fillRect(i * cw + cw * 0.14, f.CY + j * ch + ch * 0.14, cw * 0.72, ch * 0.72);
        }
      } else if (p.vari === 3) {
        /* 全セルが波打つように明滅する */
        for (let j = 0; j < rows; j++) {
          const ph = Math.sin(t * 0.04 + i * 0.55 + j * 0.4);
          const al = v * (0.25 + 0.75 * ph * ph);
          if (al < 0.05) continue;
          cx.fillStyle = `hsla(${h0 + (j / rows) * 80} 90% ${40 + al * 35}% / ${al})`;
          cx.fillRect(i * cw + cw * 0.14, j * ch + ch * 0.14, cw * 0.72, ch * 0.72);
        }
      } else {
        const lit = Math.floor(v * rows);
        for (let j = 0; j < lit; j++) {
          const frac = j / rows;
          cx.fillStyle = `hsla(${h0 + frac * 80} 90% ${38 + frac * 30}% / ${0.22 + frac * 0.55})`;
          cx.fillRect(i * cw + cw * 0.14, H - (j + 1) * ch + ch * 0.14, cw * 0.72, ch * 0.72);
        }
        if (lit > 0) {
          /* peak cap */
          cx.fillStyle = `hsl(${h0 + (lit / rows) * 80} 95% 78%)`;
          cx.fillRect(i * cw + cw * 0.14, H - lit * ch - ch * 0.55, cw * 0.72, ch * 0.28);
        }
      }
    }
    cx.restore();
  },
};
