import type { VisualMode } from "../context";

/** スペクトルで形が変わるアメーバ。vari: 1=単体 / 2=三連星 / 3=トゲトゲ */
const N = 72;
const blobR = new Float32Array(N);

export const blob: VisualMode = {
  id: "blob",
  label: "BLOB",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const h0 = f.hue();
    const g = p.gain;
    const base = Math.min(W, H) * 0.15 * (1 + a.beatEnv * p.punch * 0.35);
    for (let i = 0; i < N; i++) {
      const m = i < N / 2 ? i / (N / 2) : (N - i) / (N / 2); /* 前後対称で閉曲線を連続に */
      const fi = Math.floor(Math.pow(m, 1.3) * freq.length * 0.35);
      const tgt = base + (freq[fi] / 255) * g * Math.min(W, H) * 0.22;
      blobR[i] += (tgt - blobR[i]) * 0.18;
    }
    cx.globalCompositeOperation = p.blend;
    /* 1つのアメーバ形状を (ox, oy) にスケール sc で描く */
    const drawOne = (ox: number, oy: number, sc: number, hueShift: number): void => {
      const grad = cx.createRadialGradient(ox, oy, base * 0.2 * sc, ox, oy, base * 2.4 * sc);
      grad.addColorStop(0, `hsla(${h0 + 30 + hueShift} 90% 60% / .5)`);
      grad.addColorStop(1, `hsla(${h0 + hueShift} 90% 50% / .04)`);
      cx.beginPath();
      for (let i = 0; i <= N; i++) {
        const ang = (i / N) * Math.PI * 2;
        let r = blobR[i % N] * sc;
        if (p.vari === 3) {
          /* トゲの生えた星型モジュレーション */
          r *= 1 + 0.35 * Math.sin(ang * (5 + Math.floor(p.dens * 6)) + f.rotAcc * 3) * (0.4 + a.beatEnv * p.punch);
        }
        const x = ox + Math.cos(ang) * r;
        const y = oy + Math.sin(ang) * r;
        if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
      }
      cx.closePath();
      cx.fillStyle = grad;
      cx.fill();
      cx.strokeStyle = `hsla(${h0 + 50 + hueShift} 95% 70% / .9)`;
      cx.lineWidth = (1.5 + a.level * g * 3) * DPR;
      cx.stroke();
    };
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc * 0.6);
      if (p.vari === 2) {
        /* 小さめ3体が中心を公転する */
        const orbitR = base * 1.5;
        for (let k = 0; k < 3; k++) {
          const ang = f.rotAcc * 1.4 + (k * Math.PI * 2) / 3;
          drawOne(Math.cos(ang) * orbitR, Math.sin(ang) * orbitR, 0.55, k * 40);
        }
      } else {
        drawOne(0, 0, 1, 0);
      }
      cx.restore();
    });
  },
};
