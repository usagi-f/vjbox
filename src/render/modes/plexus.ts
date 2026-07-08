import { rnd, type VisualMode } from "../context";

interface Node {
  x: number; y: number; vx: number; vy: number; hueOff: number;
}

const nodes: Node[] = [];

/** 漂うノードを近距離で結ぶネットワーク */
export const plexus: VisualMode = {
  id: "plexus",
  label: "PLEXUS",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
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
    for (const n of nodes) {
      n.x += n.vx * sp;
      n.y += n.vy * sp;
      if (n.x < 0) n.x += W; else if (n.x > W) n.x -= W;
      if (n.y < 0) n.y += H; else if (n.y > H) n.y -= H;
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
