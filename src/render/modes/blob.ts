import type { VisualMode } from "../context";

/** スペクトルで形が変わるアメーバ。ミラーで万華鏡花になる */
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
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc * 0.6);
      const grad = cx.createRadialGradient(0, 0, base * 0.2, 0, 0, base * 2.4);
      grad.addColorStop(0, `hsla(${h0 + 30} 90% 60% / .5)`);
      grad.addColorStop(1, `hsla(${h0} 90% 50% / .04)`);
      cx.beginPath();
      for (let i = 0; i <= N; i++) {
        const ang = (i / N) * Math.PI * 2;
        const r = blobR[i % N];
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
      }
      cx.closePath();
      cx.fillStyle = grad;
      cx.fill();
      cx.strokeStyle = `hsla(${h0 + 50} 95% 70% / .9)`;
      cx.lineWidth = (1.5 + a.level * g * 3) * DPR;
      cx.stroke();
      cx.restore();
    });
  },
};
