import { rnd, type VisualMode } from "../context";

interface Cube {
  x: number; y: number; z: number;
  rot: number; vr: number; hueOff: number; sz: number;
}

const cubesArr: Cube[] = [];

function newCube(): Cube {
  return {
    x: rnd(-0.9, 0.9), y: rnd(-0.7, 0.7), z: rnd(0.35, 1),
    rot: rnd(0, 6.28), vr: rnd(-0.025, 0.025),
    hueOff: rnd(-45, 45), sz: rnd(0.05, 0.15),
  };
}

/** 手前に飛んでくる擬似3Dワイヤーキューブ */
export const cubes: VisualMode = {
  id: "cubes",
  label: "CUBES",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    const cap = 8 + Math.floor(p.dens * 26);
    while (cubesArr.length < cap) cubesArr.push(newCube());
    if (cubesArr.length > cap) cubesArr.length = cap;

    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H);
    cx.globalCompositeOperation = p.blend;
    for (const c of cubesArr) {
      c.z -= 0.0035 + a.level * g * 0.008 + a.beatEnv * p.punch * 0.006;
      c.rot += c.vr * (1 + a.beatEnv * p.punch) + p.rot * 0.004;
      if (c.z <= 0.08) {
        Object.assign(c, newCube());
        c.z = 1;
      }
      const px = f.CX + (c.x / c.z) * F * 0.5;
      const py = f.CY + (c.y / c.z) * F * 0.5;
      if (px < -F * 0.3 || px > W + F * 0.3 || py < -F * 0.3 || py > H + F * 0.3) {
        Object.assign(c, newCube());
        c.z = 1;
        continue;
      }
      const s = (c.sz / c.z) * F * 0.5;
      const al = Math.min(1, (1 - c.z) * 1.5);
      cx.save();
      cx.translate(px, py);
      cx.rotate(c.rot);
      cx.strokeStyle = `hsla(${h0 + c.hueOff} 90% 60% / ${al})`;
      cx.lineWidth = (1 + (1 - c.z) * 2 + a.beatEnv * p.punch) * DPR;
      const s2 = s * 0.55;
      cx.strokeRect(-s / 2, -s / 2, s, s);
      cx.strokeRect(-s2 / 2, -s2 / 2, s2, s2);
      cx.beginPath();
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        cx.moveTo((dx * s) / 2, (dy * s) / 2);
        cx.lineTo((dx * s2) / 2, (dy * s2) / 2);
      }
      cx.stroke();
      cx.restore();
    }
  },
};
