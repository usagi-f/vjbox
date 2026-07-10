import type { VisualMode } from "../context";

/** スペクトル履歴を奥から手前へ流す稜線ランドスケープ。vari: 1=線 / 2=山の塗り / 3=点描 */
const COLS = 64;
const ROWS = 36;
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
      /* 塗りバリエーションは面積コストが高いので1行おきに間引く */
      if (p.vari === 2 && j % 2 === 1) continue;
      const d = j / (ROWS - 1); /* 0=手前(新), 1=奥(旧) */
      const rw = terrain[j];
      const yb = bottom - d * (bottom - top);
      const mx = d * W * 0.17; /* 奥ほど幅が狭まる遠近 */
      const amp = H * 0.17 * (1 - d * 0.72) * (1 + (j === 0 ? a.beatEnv * p.punch * 0.6 : 0));
      cx.strokeStyle = `hsla(${h0 + d * 70} 85% ${62 - d * 28}% / ${1 - d * 0.82})`;
      cx.lineWidth = (2.4 - d * 1.8) * DPR;
      if (p.vari === 3) {
        /* 頂点を光点で打つ点描地形 */
        cx.fillStyle = `hsla(${h0 + d * 70} 85% ${62 - d * 28}% / ${1 - d * 0.8})`;
        for (let i = 0; i < COLS; i += 2) {
          const x = mx + (i / (COLS - 1)) * (W - 2 * mx);
          const env = Math.sin((i / (COLS - 1)) * Math.PI);
          const y = yb - rw[i] * amp * (0.3 + env * 0.95);
          cx.beginPath();
          cx.arc(x, y, (0.8 + rw[i] * 2.4) * (2 - d) * DPR, 0, Math.PI * 2);
          cx.fill();
        }
      } else {
        cx.beginPath();
        for (let i = 0; i < COLS; i++) {
          const x = mx + (i / (COLS - 1)) * (W - 2 * mx);
          const env = Math.sin((i / (COLS - 1)) * Math.PI); /* 中央を高く */
          const y = yb - rw[i] * amp * (0.3 + env * 0.95);
          if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
        }
        if (p.vari === 2) {
          /* 手前を塗り潰して山のシルエットにする。次の行のベースラインまでの帯だけ塗れば
             オクルージョンには十分なので、塗り面積を最小限に抑える */
          const strip = ((bottom - top) / (ROWS - 1)) * 2 + 2 * DPR;
          cx.lineTo(mx + (W - 2 * mx), yb + strip);
          cx.lineTo(mx, yb + strip);
          cx.closePath();
          cx.globalCompositeOperation = "source-over";
          cx.fillStyle = `hsla(${h0 + d * 70} 55% ${7 + (1 - d) * 6}% / .92)`;
          cx.fill();
          cx.globalCompositeOperation = p.blend;
        }
        cx.stroke();
      }
    }
    cx.restore();
  },
};
