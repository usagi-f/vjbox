import type { VisualMode } from "../context";

/** オシロスコープ多重線 */
export const waves: VisualMode = {
  id: "waves",
  label: "WAVE",
  draw(f) {
    const { cx, W, H, CX, CY, DPR, wave, a, p } = f;
    const lines = 1 + Math.floor(p.dens * 4);
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
    cx.lineJoin = "round";
    f.sym(() => {
      cx.save();
      cx.translate(CX, CY);
      cx.rotate(f.rotAcc * 0.4);
      cx.translate(-CX, -CY);
      for (let L = 0; L < lines; L++) {
        const yBase = CY + (L - (lines - 1) / 2) * H * 0.14;
        const amp = H * 0.16 * g * (1 + a.beatEnv * p.punch * 0.8) * (1 - L * 0.1);
        cx.strokeStyle = `hsla(${h0 + L * 22} 90% ${55 + a.beatEnv * 20}% / ${0.9 - L * 0.12})`;
        cx.lineWidth = (1.4 + (lines - L) * 0.4 + a.beatEnv * 2 * p.punch) * DPR;
        cx.beginPath();
        const step = Math.max(2, Math.floor(wave.length / 300));
        for (let i = 0; i < wave.length; i += step) {
          const x = (i / wave.length) * W;
          const v = (wave[(i + L * 97) % wave.length] - 128) / 128;
          const y = yBase + v * amp;
          if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
        }
        cx.stroke();
      }
      cx.restore();
    });
  },
};
