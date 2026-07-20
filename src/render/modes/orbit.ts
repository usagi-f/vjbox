import { rnd, type VisualMode } from "../context";

interface Body {
  r: number; ang: number; sp: number; sz: number; hueOff: number; ecc: number;
}

const bodies: Body[] = [];

function newBody(): Body {
  return {
    r: rnd(0.08, 0.46),
    ang: Math.random() * Math.PI * 2,
    sp: rnd(0.004, 0.02) * (Math.random() < 0.5 ? -1 : 1),
    sz: rnd(2, 7),
    hueOff: rnd(-40, 40),
    ecc: rnd(0.5, 0.9),
  };
}

/** 中心を公転する衛星たち。vari: 1=円軌道 / 2=楕円軌道 / 3=スポーク接続 */
export const orbit: VisualMode = {
  id: "orbit",
  label: "ORBIT",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    const want = 6 + Math.floor(p.dens * 22);
    while (bodies.length < want) bodies.push(newBody());
    if (bodies.length > want) bodies.length = want;

    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H);
    cx.globalCompositeOperation = p.blend;
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(f.rotAcc * 0.5);
      /* 中心星 */
      const coreR = F * 0.035 * (1 + a.bass * g + a.beatEnv * p.punch * 0.8);
      cx.fillStyle = `hsla(${h0} 92% 68% / .9)`;
      cx.beginPath();
      cx.arc(0, 0, coreR, 0, Math.PI * 2);
      cx.fill();
      for (const b of bodies) {
        b.ang += b.sp * (1 + a.level * g * 2 + a.beatEnv * p.punch);
        const R = b.r * F;
        const ex = p.vari === 2 ? b.ecc : 1;
        const x = Math.cos(b.ang) * R;
        const y = Math.sin(b.ang) * R * ex;
        /* 軌道ライン */
        cx.strokeStyle = `hsla(${h0 + b.hueOff} 80% 55% / .16)`;
        cx.lineWidth = 1 * DPR;
        cx.beginPath();
        if (p.vari === 2) cx.ellipse(0, 0, R, R * ex, 0, 0, Math.PI * 2);
        else cx.arc(0, 0, R, 0, Math.PI * 2);
        cx.stroke();
        if (p.vari === 3) {
          /* 中心と結ぶ光のスポーク */
          cx.strokeStyle = `hsla(${h0 + b.hueOff} 90% 60% / ${0.25 + a.beatEnv * p.punch * 0.5})`;
          cx.lineWidth = (0.8 + a.beatEnv * p.punch * 2) * DPR;
          cx.beginPath();
          cx.moveTo(0, 0);
          cx.lineTo(x, y);
          cx.stroke();
        }
        const sz = b.sz * DPR * (1 + a.treb * g + a.beatEnv * p.punch * 0.6);
        cx.fillStyle = `hsla(${h0 + b.hueOff} 90% 62% / .95)`;
        cx.beginPath();
        cx.arc(x, y, sz, 0, Math.PI * 2);
        cx.fill();
      }
      cx.restore();
    });
  },
};
