import type { VisualMode } from "../context";

/** オシロスコープ多重線。vari: 1=水平多重線 / 2=円形オシロ / 3=ミラー塗り */
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
      const step = Math.max(2, Math.floor(wave.length / 300));
      if (p.vari === 2) {
        /* 波形をリング状に巻く */
        for (let L = 0; L < lines; L++) {
          const R0 = Math.min(W, H) * (0.16 + L * 0.07) * (1 + a.beatEnv * p.punch * 0.25);
          const amp = Math.min(W, H) * 0.1 * g * (1 - L * 0.1);
          cx.strokeStyle = `hsla(${h0 + L * 22} 90% ${55 + a.beatEnv * 20}% / ${0.9 - L * 0.12})`;
          cx.lineWidth = (1.4 + (lines - L) * 0.4 + a.beatEnv * 2 * p.punch) * DPR;
          cx.beginPath();
          for (let i = 0; i <= wave.length; i += step) {
            const ang = (i / wave.length) * Math.PI * 2;
            const v = (wave[(i + L * 97) % wave.length] - 128) / 128;
            const r = R0 + v * amp;
            const x = CX + Math.cos(ang) * r;
            const y = CY + Math.sin(ang) * r;
            if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
          }
          cx.closePath();
          cx.stroke();
        }
      } else if (p.vari === 3) {
        /* 上下対称の塗り波形 */
        for (let L = 0; L < lines; L++) {
          const amp = H * 0.14 * g * (1 + a.beatEnv * p.punch * 0.8) * (1 - L * 0.16);
          cx.fillStyle = `hsla(${h0 + L * 22} 90% 55% / ${0.3 - L * 0.05})`;
          cx.strokeStyle = `hsla(${h0 + L * 22} 90% ${60 + a.beatEnv * 15}% / ${0.85 - L * 0.12})`;
          cx.lineWidth = (1.2 + a.beatEnv * 2 * p.punch) * DPR;
          cx.beginPath();
          for (let i = 0; i < wave.length; i += step) {
            const x = (i / wave.length) * W;
            const v = Math.abs(wave[(i + L * 97) % wave.length] - 128) / 128;
            const y = CY - v * amp;
            if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
          }
          for (let i = wave.length - 1; i >= 0; i -= step) {
            const x = (i / wave.length) * W;
            const v = Math.abs(wave[(i + L * 97) % wave.length] - 128) / 128;
            cx.lineTo(x, CY + v * amp);
          }
          cx.closePath();
          cx.fill();
          cx.stroke();
        }
      } else {
        for (let L = 0; L < lines; L++) {
          const yBase = CY + (L - (lines - 1) / 2) * H * 0.14;
          const amp = H * 0.16 * g * (1 + a.beatEnv * p.punch * 0.8) * (1 - L * 0.1);
          cx.strokeStyle = `hsla(${h0 + L * 22} 90% ${55 + a.beatEnv * 20}% / ${0.9 - L * 0.12})`;
          cx.lineWidth = (1.4 + (lines - L) * 0.4 + a.beatEnv * 2 * p.punch) * DPR;
          cx.beginPath();
          for (let i = 0; i < wave.length; i += step) {
            const x = (i / wave.length) * W;
            const v = (wave[(i + L * 97) % wave.length] - 128) / 128;
            const y = yBase + v * amp;
            if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
          }
          cx.stroke();
        }
      }
      cx.restore();
    });
  },
};
