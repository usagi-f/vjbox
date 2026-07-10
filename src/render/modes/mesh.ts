import type { VisualMode } from "../context";

/* 頂点バッファは使い回して毎フレームの再計算・再確保を避ける */
let vxs = new Float32Array(0);
let vys = new Float32Array(0);

/** 音でうねる遠近ワイヤーシート。vari: 1=横線 / 2=ドット行列 / 3=クロスハッチ */
export const mesh: VisualMode = {
  id: "mesh",
  label: "MESH",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p, t } = f;
    const cols = Math.floor(18 + p.dens * 22);
    const rows = Math.floor(10 + p.dens * 10);
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc * 0.15);
    cx.translate(-f.CX, -f.CY);
    /* 頂点位置を一括計算: 奥(上)ほど幅が狭い台形 + 波動 + スペクトル起伏 */
    const need = cols * rows;
    if (vxs.length < need) {
      vxs = new Float32Array(need);
      vys = new Float32Array(need);
    }
    for (let j = 0; j < rows; j++) {
      const fr = j / (rows - 1); /* 0=奥 1=手前 */
      const half = W * (0.22 + fr * 0.42);
      for (let i = 0; i < cols; i++) {
        const fi = Math.floor(Math.abs(i / (cols - 1) - 0.5) * 2 * freq.length * 0.3);
        const v = (freq[fi] / 255) * g;
        const wob = Math.sin(t * 0.045 + i * 0.5 + j * 0.7) * H * 0.02 * (1 + a.level * g * 2);
        vxs[j * cols + i] = f.CX + ((i / (cols - 1)) - 0.5) * 2 * half;
        vys[j * cols + i] = H * 0.2 + fr * fr * H * 0.72 - v * H * 0.12 * (0.3 + fr) - wob;
      }
    }
    if (p.vari === 2) {
      /* 交点を光点で打つ */
      for (let j = 0; j < rows; j++) {
        const fr = j / (rows - 1);
        for (let i = 0; i < cols; i++) {
          const fi = Math.floor(Math.abs(i / (cols - 1) - 0.5) * 2 * freq.length * 0.3);
          const v = (freq[fi] / 255) * g;
          cx.fillStyle = `hsla(${h0 + fr * 60} 90% ${45 + v * 35}% / ${0.25 + fr * 0.6})`;
          cx.beginPath();
          cx.arc(vxs[j * cols + i], vys[j * cols + i], (0.8 + fr * 1.8 + v * 2.5 + a.beatEnv * p.punch) * DPR, 0, Math.PI * 2);
          cx.fill();
        }
      }
    } else {
      for (let j = 0; j < rows; j++) {
        const fr = j / (rows - 1);
        cx.strokeStyle = `hsla(${h0 + fr * 60} 90% ${45 + fr * 20}% / ${0.2 + fr * 0.65})`;
        cx.lineWidth = (0.7 + fr * 1.8 + a.beatEnv * p.punch) * DPR;
        cx.beginPath();
        for (let i = 0; i < cols; i++) {
          const x = vxs[j * cols + i];
          const y = vys[j * cols + i];
          if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
        }
        cx.stroke();
      }
      if (p.vari === 3) {
        /* 縦線も重ねて格子にする(1本のパスにまとめて描画コストを抑える) */
        cx.strokeStyle = `hsla(${h0 + 40} 90% 55% / .3)`;
        cx.lineWidth = 0.8 * DPR;
        cx.beginPath();
        for (let i = 0; i < cols; i += 2) {
          for (let j = 0; j < rows; j++) {
            const x = vxs[j * cols + i];
            const y = vys[j * cols + i];
            if (j) cx.lineTo(x, y); else cx.moveTo(x, y);
          }
        }
        cx.stroke();
      }
    }
    cx.restore();
  },
};
