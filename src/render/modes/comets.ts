import { rnd, type Frame, type VisualMode } from "../context";

interface Comet {
  x: number; y: number; vx: number; vy: number; sz: number; hueOff: number; ang: number; r: number;
}

const comets: Comet[] = [];

function newComet(f: Frame): Comet {
  const fromLeft = Math.random() < 0.5;
  return {
    x: fromLeft ? -20 * f.DPR : f.W + 20 * f.DPR,
    y: rnd(0, f.H * 0.7),
    vx: (fromLeft ? 1 : -1) * rnd(3, 9) * f.DPR,
    vy: rnd(0.5, 3) * f.DPR,
    sz: rnd(1.5, 4),
    hueOff: rnd(-40, 40),
    ang: Math.random() * Math.PI * 2,
    r: rnd(0.12, 0.48),
  };
}

/** 尾を引いて飛ぶ彗星。vari: 1=流星 / 2=公転彗星 / 3=バウンド */
export const cometsMode: VisualMode = {
  id: "comets",
  label: "COMET",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    const want = 5 + Math.floor(p.dens * 20);
    while (comets.length < want) comets.push(newComet(f));
    if (comets.length > want) comets.length = want;

    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H);
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    for (const c of comets) {
      let px = c.x, py = c.y;
      if (p.vari === 2) {
        /* 中心を回る楕円軌道の彗星 */
        const sp = (0.008 + c.sz * 0.004) * (1 + a.level * g * 2 + a.beatEnv * p.punch);
        const pa = c.ang;
        c.ang += sp * (c.vx > 0 ? 1 : -1);
        px = f.CX + Math.cos(pa + f.rotAcc) * c.r * F;
        py = f.CY + Math.sin(pa + f.rotAcc) * c.r * F * 0.72;
        c.x = f.CX + Math.cos(c.ang + f.rotAcc) * c.r * F;
        c.y = f.CY + Math.sin(c.ang + f.rotAcc) * c.r * F * 0.72;
      } else {
        const sp = 1 + a.level * g * 2 + a.beatEnv * p.punch * 1.5;
        c.x += c.vx * sp;
        c.y += c.vy * sp;
        if (p.vari === 3) {
          /* 画面端で跳ね返る */
          if (c.x < 0 || c.x > W) { c.vx *= -1; c.x = Math.max(0, Math.min(W, c.x)); }
          if (c.y < 0 || c.y > H) { c.vy *= -1; c.y = Math.max(0, Math.min(H, c.y)); }
          if (a.beat) { c.vx *= 1 + p.punch * 0.3; c.vy *= 1 + p.punch * 0.3; }
          const cap = 12 * DPR;
          c.vx = Math.max(-cap, Math.min(cap, c.vx));
          c.vy = Math.max(-cap, Math.min(cap, c.vy));
        } else if (c.x < -40 * DPR || c.x > W + 40 * DPR || c.y > H + 40 * DPR) {
          Object.assign(c, newComet(f));
          continue;
        }
      }
      /* 尾: 進行方向の逆へグラデ */
      const dx = c.x - px, dy = c.y - py;
      const mag = Math.hypot(dx, dy) || 1;
      const tail = (24 + a.level * g * 60 + c.sz * 10) * DPR;
      const tx = c.x - (dx / mag) * tail;
      const ty = c.y - (dy / mag) * tail;
      const grad = cx.createLinearGradient(tx, ty, c.x, c.y);
      grad.addColorStop(0, `hsla(${h0 + c.hueOff} 90% 55% / 0)`);
      grad.addColorStop(1, `hsla(${h0 + c.hueOff} 90% 65% / .85)`);
      cx.strokeStyle = grad;
      cx.lineWidth = c.sz * (1 + a.beatEnv * p.punch) * DPR;
      cx.beginPath();
      cx.moveTo(tx, ty);
      cx.lineTo(c.x, c.y);
      cx.stroke();
      cx.fillStyle = `hsla(${h0 + c.hueOff} 95% 75% / .95)`;
      cx.beginPath();
      cx.arc(c.x, c.y, c.sz * (1 + a.beatEnv * p.punch * 0.8) * DPR, 0, Math.PI * 2);
      cx.fill();
    }
  },
};
