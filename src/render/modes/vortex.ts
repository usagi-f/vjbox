import { rnd, type VisualMode } from "../context";

interface Mote {
  ang: number; r: number; sp: number; sz: number; hueOff: number;
}

const motes: Mote[] = [];

function newMote(): Mote {
  return {
    ang: Math.random() * Math.PI * 2,
    r: rnd(0.75, 1.15),
    sp: rnd(0.02, 0.06),
    sz: rnd(1, 3.2),
    hueOff: rnd(-35, 35),
  };
}

/** 中心に吸い込まれる渦。vari: 1=光点 / 2=ストリーク / 3=収縮リング */
export const vortex: VisualMode = {
  id: "vortex",
  label: "VORTX",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    const cap = Math.floor(90 + p.dens * 260);
    while (motes.length < cap) motes.push(newMote());
    if (motes.length > cap) motes.length = cap;

    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H) * 0.52;
    const dir = p.rot >= 0 ? 1 : -1;
    cx.globalCompositeOperation = p.blend;
    cx.save();
    cx.translate(f.CX, f.CY);
    if (p.vari === 3) {
      /* リングが回転しながら中心へ縮む */
      const rings = Math.floor(8 + p.dens * 16);
      for (let i = 0; i < rings; i++) {
        const m = motes[i % motes.length];
        m.r -= 0.004 * (1 + a.level * g * 3 + a.beatEnv * p.punch * 2);
        if (m.r <= 0.04) Object.assign(m, newMote());
        const rr = m.r * F;
        const fade = Math.min(1, m.r * 1.6) * (1 - m.r * 0.4);
        cx.strokeStyle = `hsla(${h0 + m.hueOff} 90% ${50 + fade * 25}% / ${fade})`;
        cx.lineWidth = (1 + (1 - m.r) * 3 + a.beatEnv * p.punch * 2) * DPR;
        const segs = 3;
        const span = (Math.PI * 2) / segs - 0.35;
        for (let s = 0; s < segs; s++) {
          const a0 = m.ang * dir + f.rotAcc * 2 + (s / segs) * Math.PI * 2 + (1 - m.r) * 5 * dir;
          cx.beginPath();
          cx.arc(0, 0, rr, a0, a0 + span);
          cx.stroke();
        }
      }
    } else {
      for (const m of motes) {
        const pull = 0.0035 * (1 + a.level * g * 3 + a.beatEnv * p.punch * 2);
        m.r -= pull;
        m.ang += m.sp * dir * (1 + (1 - m.r) * 2.5) * (1 + a.bass * g);
        if (m.r <= 0.02) Object.assign(m, newMote());
        const rr = m.r * F;
        const x = Math.cos(m.ang + f.rotAcc) * rr;
        const y = Math.sin(m.ang + f.rotAcc) * rr;
        const fade = Math.min(1, (1.1 - m.r) * 1.4) * Math.min(1, m.r * 6);
        if (p.vari === 2) {
          /* 進行方向へ弧のストリークを引く */
          const tail = 0.25 + (1 - m.r) * 0.6;
          cx.strokeStyle = `hsla(${h0 + m.hueOff} 90% ${52 + fade * 25}% / ${fade * 0.85})`;
          cx.lineWidth = (0.8 + (1 - m.r) * 2 + a.beatEnv * p.punch) * DPR;
          cx.beginPath();
          cx.arc(0, 0, rr, m.ang + f.rotAcc - tail * dir, m.ang + f.rotAcc, dir < 0);
          cx.stroke();
        } else {
          cx.fillStyle = `hsla(${h0 + m.hueOff} 90% ${52 + fade * 28}% / ${fade})`;
          cx.beginPath();
          cx.arc(x, y, m.sz * (0.6 + (1 - m.r) * 1.4) * DPR, 0, Math.PI * 2);
          cx.fill();
        }
      }
    }
    /* 中心の吸い込み口 */
    cx.strokeStyle = `hsla(${h0} 92% 68% / .9)`;
    cx.lineWidth = (1.5 + a.beatEnv * p.punch * 3) * DPR;
    cx.beginPath();
    cx.arc(0, 0, Math.min(W, H) * 0.03 * (1 + a.bass * g), 0, Math.PI * 2);
    cx.stroke();
    cx.restore();
  },
};
