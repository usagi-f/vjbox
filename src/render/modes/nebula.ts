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

/** 漂う星雲ガス。vari: 1=漂流雲 / 2=ビートフレア / 3=オーロラカーテン */
export const nebula: VisualMode = {
  id: "nebula",
  label: "NEBLA",
  draw(f) {
    const { cx, W, H, freq, a, p, t } = f;
    const h0 = f.hue();
    const g = p.gain;
    cx.globalCompositeOperation = p.blend;
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
    const want = 6 + Math.floor(p.dens * 14);
    while (clouds.length < want) clouds.push(newCloud());
    if (clouds.length > want) clouds.length = want;
    for (const c of clouds) {
      c.x += c.vx * (1 + a.level * g * 2);
      c.y += c.vy * (1 + a.level * g * 2);
      if (c.x < -0.3) c.x += 1.6; else if (c.x > 1.3) c.x -= 1.6;
      if (c.y < -0.3) c.y += 1.6; else if (c.y > 1.3) c.y -= 1.6;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + c.ph);
      let R = c.r * Math.min(W, H) * (1 + pulse * 0.3 + a.bass * g * 0.6);
      let al = 0.16 + pulse * 0.12 + a.level * g * 0.15;
      if (p.vari === 2) {
        /* ビートで一斉にフレアする */
        R *= 1 + a.beatEnv * p.punch * 0.9;
        al += a.beatEnv * p.punch * 0.35;
      }
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
