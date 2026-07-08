import type { VisualMode } from "../context";

/** スペクトル履歴を奥から手前へ流す稜線ランドスケープ */
const COLS = 96;
const ROWS = 44;
const terrain: Float32Array[] = [];

export const ridge: VisualMode = {
  id: "ridge",
  label: "RIDGE",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p, t } = f;
    const pushEvery = Math.max(1, 4 - Math.round(p.dens * 3));
    if (t % pushEvery === 0) {
      const row = new Float32Array(COLS);
      for (let i = 0; i < COLS; i++) {
        const fi = Math.floor(Math.pow(i / COLS, 1.5) * freq.length * 0.55);
        row[i] = Math.min(1, (freq[fi] / 255) * p.gain);
      }
      terrain.unshift(row);
      if (terrain.length > ROWS) terrain.pop();
    }
    const h0 = f.hue();
    const top = H * 0.16;
    const bottom = H * 0.92;
    cx.globalCompositeOperation = p.blend;
    cx.lineJoin = "round";
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc * 0.06);
    cx.translate(-f.CX, -f.CY);
    for (let j = Math.min(terrain.length, ROWS) - 1; j >= 0; j--) {
      const d = j / (ROWS - 1); /* 0=手前(新), 1=奥(旧) */
      const rw = terrain[j];
      const yb = bottom - d * (bottom - top);
      const mx = d * W * 0.17; /* 奥ほど幅が狭まる遠近 */
      const amp = H * 0.17 * (1 - d * 0.72) * (1 + (j === 0 ? a.beatEnv * p.punch * 0.6 : 0));
      cx.strokeStyle = `hsla(${h0 + d * 70} 85% ${62 - d * 28}% / ${1 - d * 0.82})`;
      cx.lineWidth = (2.4 - d * 1.8) * DPR;
      cx.beginPath();
      for (let i = 0; i < COLS; i++) {
        const x = mx + (i / (COLS - 1)) * (W - 2 * mx);
        const env = Math.sin((i / (COLS - 1)) * Math.PI); /* 中央を高く */
        const y = yb - rw[i] * amp * (0.3 + env * 0.95);
        if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
      }
      cx.stroke();
    }
    cx.restore();
  },
};
