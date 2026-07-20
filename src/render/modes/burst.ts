import { rnd, type Frame, type VisualMode } from "../context";

interface Ray {
  a: number; r: number; sp: number; len: number; w: number; hueOff: number;
}

const rays: Ray[] = [];

function newRay(f: Frame, hard: boolean): Ray {
  return {
    a: Math.random() * Math.PI * 2,
    r: rnd(8, 60) * f.DPR,
    sp: hard ? rnd(6, 15) : rnd(1.8, 5.5),
    len: rnd(30, 150) * f.DPR,
    w: rnd(0.8, 2.4),
    hueOff: rnd(-30, 50),
  };
}

/** 中心から飛び出すスピードライン。vari: 1=ライン / 2=彗星 / 3=破片 */
export const burst: VisualMode = {
  id: "burst",
  label: "BURST",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    if (a.beat) for (let i = 0, k = 10 + p.punch * 45; i < k; i++) rays.push(newRay(f, true));
    const cap = 40 + p.dens * 180;
    if (rays.length < cap && Math.random() < 0.25 + a.level) rays.push(newRay(f, false));

    const h0 = f.hue();
    const maxR = Math.hypot(W, H) * 0.55;
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(f.rotAcc * 0.3);
    for (let i = rays.length - 1; i >= 0; i--) {
      const r = rays[i];
      r.r += r.sp * (1 + a.level * p.gain * 2) * DPR;
      r.a += p.rot * 0.003;
      if (r.r > maxR) {
        rays.splice(i, 1);
        continue;
      }
      const fade = 1 - r.r / maxR;
      const len = r.len * (0.35 + a.level * p.gain);
      const c = Math.cos(r.a), s = Math.sin(r.a);
      if (p.vari === 2) {
        /* 尾を引く彗星: グラデ線 + 光る頭 */
        const grad = cx.createLinearGradient(c * r.r, s * r.r, c * (r.r + len), s * (r.r + len));
        grad.addColorStop(0, `hsla(${h0 + r.hueOff} 90% 55% / 0)`);
        grad.addColorStop(1, `hsla(${h0 + r.hueOff} 90% 65% / ${fade})`);
        cx.strokeStyle = grad;
        cx.lineWidth = r.w * (1 + a.beatEnv * p.punch) * DPR;
        cx.beginPath();
        cx.moveTo(c * r.r, s * r.r);
        cx.lineTo(c * (r.r + len), s * (r.r + len));
        cx.stroke();
        cx.fillStyle = `hsla(${h0 + r.hueOff} 95% 75% / ${fade})`;
        cx.beginPath();
        cx.arc(c * (r.r + len), s * (r.r + len), r.w * (1.2 + a.beatEnv * p.punch) * DPR, 0, Math.PI * 2);
        cx.fill();
      } else if (p.vari === 3) {
        /* 回転しながら飛ぶ三角形の破片 */
        const sz = r.w * (3 + fade * 4) * DPR;
        cx.save();
        cx.translate(c * (r.r + len * 0.5), s * (r.r + len * 0.5));
        cx.rotate(r.a + r.r * 0.02);
        cx.strokeStyle = `hsla(${h0 + r.hueOff} 90% ${55 + fade * 20}% / ${fade * 0.9})`;
        cx.lineWidth = (1 + a.beatEnv * p.punch) * DPR;
        cx.beginPath();
        cx.moveTo(sz, 0);
        cx.lineTo(-sz * 0.6, sz * 0.7);
        cx.lineTo(-sz * 0.6, -sz * 0.7);
        cx.closePath();
        cx.stroke();
        cx.restore();
      } else {
        cx.strokeStyle = `hsla(${h0 + r.hueOff} 90% ${55 + fade * 20}% / ${fade * 0.9})`;
        cx.lineWidth = r.w * (1 + a.beatEnv * p.punch) * DPR;
        cx.beginPath();
        cx.moveTo(c * r.r, s * r.r);
        cx.lineTo(c * (r.r + len), s * (r.r + len));
        cx.stroke();
      }
    }
    cx.restore();
  },
};
