import { rnd, type VisualMode } from "../context";

interface Shard {
  r: number; ang: number; rot: number; vr: number; sz: number; hueOff: number;
  dx: number; dy: number;
}

const shardsArr: Shard[] = [];

function newShard(): Shard {
  return {
    r: rnd(0.08, 0.45),
    ang: Math.random() * Math.PI * 2,
    rot: rnd(0, 6.28),
    vr: rnd(-0.04, 0.04),
    sz: rnd(0.02, 0.08),
    hueOff: rnd(-45, 45),
    dx: rnd(-1, 1),
    dy: rnd(-1, 1),
  };
}

/** 中心の周りを舞う三角形の破片。vari: 1=輪郭 / 2=塗り / 3=自由漂流 */
export const shards: VisualMode = {
  id: "shards",
  label: "SHARD",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    const want = 10 + Math.floor(p.dens * 40);
    while (shardsArr.length < want) shardsArr.push(newShard());
    if (shardsArr.length > want) shardsArr.length = want;

    const h0 = f.hue();
    const g = p.gain;
    const F = Math.min(W, H);
    cx.globalCompositeOperation = p.blend;
    f.sym(() => {
      cx.save();
      cx.translate(f.CX, f.CY);
      for (const s of shardsArr) {
        s.rot += s.vr * (1 + a.level * g * 2) + p.rot * 0.006;
        let x: number, y: number;
        if (p.vari === 3) {
          /* 円環に縛られず画面を漂う */
          s.dx += rnd(-0.02, 0.02);
          s.dy += rnd(-0.02, 0.02);
          s.ang += 0.003;
          x = Math.cos(s.ang * 3 + s.rot * 0.2) * s.r * F + s.dx * F * 0.15;
          y = Math.sin(s.ang * 2 + s.rot * 0.15) * s.r * F * 0.8 + s.dy * F * 0.15;
        } else {
          s.ang += 0.006 * (1 + a.level * g * 2 + a.beatEnv * p.punch) * (s.vr > 0 ? 1 : -1);
          const R = s.r * F * (1 + a.beatEnv * p.punch * 0.25);
          x = Math.cos(s.ang + f.rotAcc) * R;
          y = Math.sin(s.ang + f.rotAcc) * R;
        }
        const sz = s.sz * F * (1 + a.bass * g * 0.6 + a.beatEnv * p.punch * 0.5);
        cx.save();
        cx.translate(x, y);
        cx.rotate(s.rot);
        cx.beginPath();
        cx.moveTo(sz, 0);
        cx.lineTo(-sz * 0.55, sz * 0.75);
        cx.lineTo(-sz * 0.55, -sz * 0.75);
        cx.closePath();
        if (p.vari === 2) {
          cx.fillStyle = `hsla(${h0 + s.hueOff} 90% 55% / ${0.35 + a.beatEnv * p.punch * 0.4})`;
          cx.fill();
        }
        cx.strokeStyle = `hsla(${h0 + s.hueOff} 90% 62% / .85)`;
        cx.lineWidth = (1 + a.beatEnv * p.punch * 2) * DPR;
        cx.stroke();
        cx.restore();
      }
      cx.restore();
    });
  },
};
