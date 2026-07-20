import { rnd, type VisualMode } from "../context";

interface Cloud {
  x: number; y: number; vx: number; vy: number; r: number; hueOff: number; ph: number;
}

const clouds: Cloud[] = [];

function newCloud(): Cloud {
  return {
    x: Math.random(), y: Math.random(),
    vx: rnd(-0.0008, 0.0008), vy: rnd(-0.0008, 0.0008),
    r: rnd(0.1, 0.3),
    hueOff: rnd(-50, 50),
    ph: Math.random() * Math.PI * 2,
  };
}

/* vari2 用: ビートで放たれる衝撃波リング */
const shocks: number[] = [];

/** 漂う星雲ガス。vari: 1=漂流雲 / 2=中心コア+衝撃波 / 3=オーロラカーテン */
export const nebula: VisualMode = {
  id: "nebula",
  label: "NEBLA",
  draw(f) {
    const { cx, W, H, freq, a, p, t } = f;
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
    if (p.vari === 2) {
      /* 呼吸する巨大な中心コア + ビートの衝撃波 */
      const F = Math.min(W, H);
      const R = F * (0.22 + 0.05 * Math.sin(t * 0.02)) * (1 + a.bass * g * 0.8 + a.beatEnv * p.punch * 0.4);
      const core = cx.createRadialGradient(f.CX, f.CY, 0, f.CX, f.CY, R);
      core.addColorStop(0, `hsla(${h0 + 40} 90% 72% / .85)`);
      core.addColorStop(0.45, `hsla(${h0} 88% 55% / .4)`);
      core.addColorStop(1, `hsla(${h0 - 30} 85% 45% / 0)`);
      cx.fillStyle = core;
      cx.beginPath();
      cx.arc(f.CX, f.CY, R, 0, Math.PI * 2);
      cx.fill();
      /* ガスの外殻: 周波数で歪む薄いハロー */
      cx.strokeStyle = `hsla(${h0 + 60} 90% 65% / .5)`;
      cx.lineWidth = (1.5 + a.level * g * 3) * f.DPR;
      cx.beginPath();
      const NPT = 48;
      for (let i = 0; i <= NPT; i++) {
        const ang = (i / NPT) * Math.PI * 2;
        const m = i < NPT / 2 ? i / (NPT / 2) : (NPT - i) / (NPT / 2);
        const fi = Math.floor(m * freq.length * 0.3);
        const rr = R * (1.1 + (freq[fi] / 255) * g * 0.35);
        const x = f.CX + Math.cos(ang + f.rotAcc * 0.5) * rr;
        const y = f.CY + Math.sin(ang + f.rotAcc * 0.5) * rr;
        if (i) cx.lineTo(x, y); else cx.moveTo(x, y);
      }
      cx.closePath();
      cx.stroke();
      /* 衝撃波 */
      if (a.beat) shocks.push(R);
      if (shocks.length > 8) shocks.splice(0, shocks.length - 8);
      const maxR = Math.hypot(W, H) * 0.6;
      for (let i = shocks.length - 1; i >= 0; i--) {
        shocks[i] += (6 + a.level * g * 10) * f.DPR;
        if (shocks[i] > maxR) {
          shocks.splice(i, 1);
          continue;
        }
        const fade = 1 - shocks[i] / maxR;
        cx.strokeStyle = `hsla(${h0 + 30} 90% 65% / ${fade * 0.6})`;
        cx.lineWidth = (2 + fade * 6 * p.punch) * f.DPR;
        cx.beginPath();
        cx.arc(f.CX, f.CY, shocks[i], 0, Math.PI * 2);
        cx.stroke();
      }
      return;
    }
    if (p.vari === 3) {
      /* 縦のグラデ帯が揺れるオーロラ */
      const bands = Math.floor(5 + p.dens * 9);
      for (let i = 0; i < bands; i++) {
        const fr = i / (bands - 1);
        const fi = Math.floor(fr * freq.length * 0.4);
        const v = (freq[fi] / 255) * g;
        const cxr = (fr + Math.sin(t * 0.008 + i * 1.8) * 0.06) * W;
        const bw = W * (0.05 + v * 0.12);
        const topY = H * (0.05 + 0.25 * Math.sin(t * 0.01 + i * 2.6) * 0.5 + 0.15);
        const grad = cx.createLinearGradient(0, topY, 0, H);
        grad.addColorStop(0, `hsla(${h0 + fr * 90} 90% ${50 + v * 25}% / ${0.25 + v * 0.5})`);
        grad.addColorStop(1, `hsla(${h0 + fr * 90 + 40} 90% 45% / 0)`);
        cx.fillStyle = grad;
        cx.fillRect(cxr - bw / 2, topY, bw, H - topY);
      }
      return;
    }
    const want = 5 + Math.floor(p.dens * 9);
    while (clouds.length < want) clouds.push(newCloud());
    if (clouds.length > want) clouds.length = want;
    for (const c of clouds) {
      c.x += c.vx * (1 + a.level * g * 2);
      c.y += c.vy * (1 + a.level * g * 2);
      if (c.x < -0.3) c.x += 1.6; else if (c.x > 1.3) c.x -= 1.6;
      if (c.y < -0.3) c.y += 1.6; else if (c.y > 1.3) c.y -= 1.6;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + c.ph);
      /* 高感度でも半径が膨張しすぎないようクランプ(塗り面積の暴発防止) */
      const R = c.r * Math.min(W, H) * (1 + pulse * 0.3 + Math.min(1, a.bass * g) * 0.5);
      const al = 0.16 + pulse * 0.12 + a.level * g * 0.15;
      const grad = cx.createRadialGradient(c.x * W, c.y * H, 0, c.x * W, c.y * H, R);
      grad.addColorStop(0, `hsla(${h0 + c.hueOff} 85% 60% / ${Math.min(0.8, al)})`);
      grad.addColorStop(1, `hsla(${h0 + c.hueOff + 30} 85% 50% / 0)`);
      cx.fillStyle = grad;
      cx.beginPath();
      cx.arc(c.x * W, c.y * H, R, 0, Math.PI * 2);
      cx.fill();
    }
    /* 芯になる光点 */
    cx.fillStyle = `hsla(${h0} 90% 75% / ${0.3 + a.treb * g * 0.5})`;
    for (const c of clouds) {
      cx.beginPath();
      cx.arc(c.x * W, c.y * H, (1 + a.treb * g * 3) * f.DPR, 0, Math.PI * 2);
      cx.fill();
    }
  },
};
