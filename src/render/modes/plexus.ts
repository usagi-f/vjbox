import { rnd, type VisualMode } from "../context";

interface Node {
  x: number; y: number; vx: number; vy: number; hueOff: number;
}

const nodes: Node[] = [];

/** 漂うノードを近距離で結ぶネットワーク。vari: 1=漂流 / 2=重力クラスタ / 3=呼吸する格子 */
export const plexus: VisualMode = {
  id: "plexus",
  label: "PLEXUS",
  draw(f) {
    const { cx, W, H, DPR, a, p, t } = f;
    const want = Math.floor(26 + p.dens * 64);
    while (nodes.length < want) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: rnd(-0.5, 0.5) * DPR, vy: rnd(-0.5, 0.5) * DPR,
        hueOff: rnd(-30, 30),
      });
    }
    if (nodes.length > want) nodes.length = want;

    const h0 = f.hue();
    const g = p.gain;
    const sp = 0.6 + a.level * g * 2.5 + a.beatEnv * p.punch * 1.5;
    const linkR = Math.min(W, H) * (0.11 + a.bass * g * 0.1);
    const lr2 = linkR * linkR;
    cx.globalCompositeOperation = p.blend;
    if (p.vari === 2) {
      /* 中心へ引かれ、ビートで弾け飛ぶクラスタ */
      for (const n of nodes) {
        const dx = n.x - f.CX, dy = n.y - f.CY;
        const d = Math.hypot(dx, dy) || 1;
        n.vx += (-dx / d) * 0.05 * DPR;
        n.vy += (-dy / d) * 0.05 * DPR;
        if (a.beat) {
          n.vx += (dx / d) * (2 + p.punch * 5) * DPR * Math.random();
          n.vy += (dy / d) * (2 + p.punch * 5) * DPR * Math.random();
        }
        n.vx *= 0.985;
        n.vy *= 0.985;
        n.x += n.vx * sp;
        n.y += n.vy * sp;
      }
    } else if (p.vari === 3) {
      /* 格子点に吸着しつつ音でうねるメッシュ */
      const gc = Math.max(4, Math.round(Math.sqrt((want * W) / H)));
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const gx = ((i % gc) + 0.5) * (W / gc);
        const gy = (Math.floor(i / gc) + 0.5) * (H / Math.ceil(want / gc));
        const wob = Math.min(W, H) * 0.045 * (1 + a.bass * g * 2);
        const tx = gx + Math.sin(t * 0.02 + i * 1.7) * wob;
        const ty = gy + Math.cos(t * 0.017 + i * 2.3) * wob;
        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;
      }
    } else {
      for (const n of nodes) {
        n.x += n.vx * sp;
        n.y += n.vy * sp;
        if (n.x < 0) n.x += W; else if (n.x > W) n.x -= W;
        if (n.y < 0) n.y += H; else if (n.y > H) n.y -= H;
      }
    }
    cx.lineWidth = 0.8 * DPR;
    for (let i = 0; i < nodes.length; i++) {
      const na = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nb = nodes[j];
        const dx = na.x - nb.x, dy = na.y - nb.y;
        if (dx > linkR || dx < -linkR || dy > linkR || dy < -linkR) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > lr2) continue;
        cx.strokeStyle = `hsla(${h0} 90% 60% / ${(1 - Math.sqrt(d2) / linkR) * 0.55})`;
        cx.beginPath();
        cx.moveTo(na.x, na.y);
        cx.lineTo(nb.x, nb.y);
        cx.stroke();
      }
      cx.fillStyle = `hsla(${h0 + na.hueOff} 90% 65% / .9)`;
      cx.beginPath();
      cx.arc(na.x, na.y, (1.4 + a.beatEnv * p.punch * 2.5) * DPR, 0, Math.PI * 2);
      cx.fill();
    }
  },
};
