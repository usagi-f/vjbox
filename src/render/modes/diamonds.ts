import type { VisualMode } from "../context";

/** 同心の回転スクエア。vari: 1=同心 / 2=交互回転 / 3=ビート発破 */
let boost = 0;

export const diamonds: VisualMode = {
  id: "diamonds",
  label: "DIAMD",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const n = Math.floor(6 + p.dens * 16);
    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H) * 0.62;
    if (a.beat) boost = 1;
    boost *= 0.93;
    cx.globalCompositeOperation = p.blend;
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      for (let i = n - 1; i >= 0; i--) {
        const fr = (i + 1) / n;
        const fi = Math.floor(fr * freq.length * 0.5);
        const v = Math.min(1, (freq[fi] / 255) * g);
        let sz = F * fr * (1 + v * 0.18 + a.beatEnv * p.punch * 0.1);
        if (p.vari === 3) {
          /* ビートで外側ほど大きく弾け飛ぶ */
          sz *= 1 + boost * p.punch * fr * 0.8;
        }
        cx.save();
        const dir = p.vari === 2 && i % 2 === 1 ? -1 : 1;
        cx.rotate(f.rotAcc * dir + (p.vari === 2 ? 0 : fr * 0.5) + Math.PI / 4);
        cx.strokeStyle = `hsla(${h0 + fr * 90} 90% ${45 + v * 30}% / ${0.25 + v * 0.6 + (p.vari === 3 ? boost * 0.3 : 0)})`;
        cx.lineWidth = (1 + v * 3.5 + a.beatEnv * p.punch * 2) * DPR;
        cx.strokeRect(-sz / 2, -sz / 2, sz, sz);
        cx.restore();
      }
      cx.restore();
    });
  },
};
