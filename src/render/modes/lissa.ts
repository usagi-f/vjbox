import type { VisualMode } from "../context";

/** 波形をXYプロットするアナログオシロ風リサージュ。vari: 1=XY / 2=パラメトリック / 3=ドット */
export const lissa: VisualMode = {
  id: "lissa",
  label: "LISSA",
  draw(f) {
    const { cx, W, H, wave, a, p, t } = f;
    const g = p.gain;
    const h0 = f.hue();
    const R = Math.min(W, H) * 0.36 * (1 + a.beatEnv * p.punch * 0.3);
    const n = wave.length;
    const delay = Math.floor(n * 0.12 + n * 0.1 * Math.sin(t * 0.006 * (1 + Math.abs(p.rot) * 2)));
    const segs = Math.floor(70 + p.dens * 160);
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc * 0.5);
      cx.lineWidth = (1.2 + a.level * g * 2.5) * f.DPR;
      let px = 0, py = 0;
      const span = n - 1 - delay;
      if (p.vari === 2) {
        /* 周波数比のパラメトリック曲線を音で歪ませる */
        const kx = 2 + Math.floor(p.dens * 3);
        const ky = kx + 1;
        for (let s = 0; s <= segs; s++) {
          const th = (s / segs) * Math.PI * 2;
          const i = Math.floor((s / segs) * (n - 1));
          const mod = 1 + ((wave[i] - 128) / 128) * 0.35 * g;
          const x = Math.sin(kx * th + t * 0.012) * R * mod;
          const y = Math.sin(ky * th) * R * mod;
          if (s) {
            cx.strokeStyle = `hsla(${h0 + (s / segs) * 130} 90% 60% / .75)`;
            cx.beginPath();
            cx.moveTo(px, py);
            cx.lineTo(x, y);
            cx.stroke();
          }
          px = x;
          py = y;
        }
      } else if (p.vari === 3) {
        /* 線を結ばず光点を散らす */
        for (let s = 0; s <= segs; s++) {
          const i = Math.floor((s / segs) * span);
          const x = ((wave[i] - 128) / 128) * R * g;
          const y = ((wave[i + delay] - 128) / 128) * R * g;
          cx.fillStyle = `hsla(${h0 + (s / segs) * 130} 90% 62% / .8)`;
          cx.beginPath();
          cx.arc(x, y, (1 + a.level * g * 2 + a.beatEnv * p.punch * 2) * f.DPR, 0, Math.PI * 2);
          cx.fill();
        }
      } else {
        for (let s = 0; s <= segs; s++) {
          const i = Math.floor((s / segs) * span);
          const x = ((wave[i] - 128) / 128) * R * g;
          const y = ((wave[i + delay] - 128) / 128) * R * g;
          if (s) {
            cx.strokeStyle = `hsla(${h0 + (s / segs) * 130} 90% 60% / .75)`;
            cx.beginPath();
            cx.moveTo(px, py);
            cx.lineTo(x, y);
            cx.stroke();
          }
          px = x;
          py = y;
        }
      }
      cx.restore();
    });
  },
};
