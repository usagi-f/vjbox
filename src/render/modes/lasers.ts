import type { VisualMode } from "../context";

/** クラブのレーザービーム。vari: 1=下から扇 / 2=左右クロス / 3=回転ビーコン */
export const lasers: VisualMode = {
  id: "lasers",
  label: "LASER",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p, t } = f;
    const beams = Math.floor(6 + p.dens * 18);
    const h0 = f.hue();
    const g = p.gain;
    const R = Math.hypot(W, H) * 1.1;
    const sweep = Math.sin(t * 0.02 * (1 + Math.abs(p.rot) * 2));
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    const beam = (ox: number, oy: number, ang: number, v: number, hue: number): void => {
      const w = (1 + v * 5 + a.beatEnv * p.punch * 5) * DPR;
      const grad = cx.createLinearGradient(ox, oy, ox + Math.cos(ang) * R, oy + Math.sin(ang) * R);
      grad.addColorStop(0, `hsla(${hue} 95% 65% / ${0.5 + v * 0.5})`);
      grad.addColorStop(1, `hsla(${hue} 95% 55% / 0)`);
      cx.strokeStyle = grad;
      cx.lineWidth = w;
      cx.beginPath();
      cx.moveTo(ox, oy);
      cx.lineTo(ox + Math.cos(ang) * R, oy + Math.sin(ang) * R);
      cx.stroke();
    };
    if (p.vari === 2) {
      /* 左右下角から交差するビーム(両側で2倍になるため本数は半分にして負荷を揃える) */
      const half = Math.max(3, Math.ceil(beams / 2));
      for (let i = 0; i < half; i++) {
        const fr = i / (half - 1);
        const fi = Math.floor(fr * freq.length * 0.5);
        const v = Math.min(1, (freq[fi] / 255) * g);
        const spread = 0.55 + sweep * 0.2 + v * 0.2;
        beam(0, H, -Math.PI / 2 + fr * spread + 0.12, v, h0 + fr * 70);
        beam(W, H, -Math.PI / 2 - fr * spread - 0.12, v, h0 + fr * 70 + 30);
      }
    } else if (p.vari === 3) {
      /* 中心の灯台が全周に回転照射 */
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc * 2);
      for (let i = 0; i < beams; i++) {
        const fr = i / beams;
        const fi = Math.floor(fr * freq.length * 0.5);
        const v = Math.min(1, (freq[fi] / 255) * g);
        beam(0, 0, fr * Math.PI * 2, v, h0 + fr * 110);
      }
      cx.restore();
      cx.fillStyle = `hsla(${h0} 92% 70% / .9)`;
      cx.beginPath();
      cx.arc(f.CX, f.CY, Math.min(W, H) * 0.02 * (1 + a.beatEnv * p.punch * 2), 0, Math.PI * 2);
      cx.fill();
    } else {
      /* 下辺中央から扇状に振る */
      for (let i = 0; i < beams; i++) {
        const fr = beams === 1 ? 0.5 : i / (beams - 1);
        const fi = Math.floor(fr * freq.length * 0.5);
        const v = Math.min(1, (freq[fi] / 255) * g);
        const ang = -Math.PI / 2 + (fr - 0.5) * (1.6 + sweep * 0.5) + p.rot * 0.4;
        beam(f.CX, H + 4 * DPR, ang, v, h0 + fr * 90);
      }
    }
  },
};
