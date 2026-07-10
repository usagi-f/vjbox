import { rnd, type Frame, type VisualMode } from "../context";

/* 直近の軌跡を保持して毎フレーム描き直す(残像設定に依存せず線がくっきり残る) */
const HIST = 46;

interface Walker {
  x: number; y: number; dir: number; ang: number; drift: number;
  hueOff: number; steps: number; hist: number[];
}

const walkers: Walker[] = [];

function newWalker(f: Frame, central: boolean): Walker {
  const R = Math.min(f.W, f.H);
  const x = central ? f.CX + rnd(-R * 0.05, R * 0.05) : rnd(f.W * 0.1, f.W * 0.9);
  const y = central ? f.CY + rnd(-R * 0.05, R * 0.05) : rnd(f.H * 0.1, f.H * 0.9);
  return {
    x, y,
    dir: Math.floor(Math.random() * 4),
    ang: Math.random() * Math.PI * 2,
    drift: rnd(-0.06, 0.06),
    hueOff: rnd(-40, 40),
    steps: 0,
    hist: [x, y],
  };
}

/** 画面を這うネオンライン。vari: 1=直交パイプ / 2=有機的な蔦 / 3=曼荼羅 */
export const pipes: VisualMode = {
  id: "pipes",
  label: "PIPES",
  draw(f) {
    const { cx, W, H, DPR, a, p, t } = f;
    const central = p.vari === 3;
    const want = central ? 2 + Math.floor(p.dens * 4) : 3 + Math.floor(p.dens * 12);
    while (walkers.length < want) walkers.push(newWalker(f, central));
    if (walkers.length > want) walkers.length = want;

    const h0 = f.hue();
    const g = p.gain;
    const speed = (2.5 + a.level * g * 8 + a.beatEnv * p.punch * 5) * DPR;
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    cx.lineJoin = "round";
    for (const w of walkers) {
      let ang: number;
      if (p.vari === 2) {
        /* 蔦: 角度が連続的にうねり、ビートで大きく曲がる */
        w.drift += rnd(-0.012, 0.012);
        w.drift = Math.max(-0.09, Math.min(0.09, w.drift));
        w.ang += w.drift + Math.sin(t * 0.03 + w.steps * 0.05) * 0.05 * (1 + a.bass * g);
        if (a.beat) w.ang += rnd(-0.9, 0.9) * p.punch;
        ang = w.ang;
      } else {
        /* パイプ: 90度刻み(曼荼羅は45度刻みで模様が複雑になる) */
        ang = central ? w.dir * (Math.PI / 4) : w.dir * (Math.PI / 2);
      }
      const nx = w.x + Math.cos(ang) * speed;
      const ny = w.y + Math.sin(ang) * speed;
      const lw = (1.6 + a.bass * g * 3 + a.beatEnv * p.punch * 2) * DPR;
      if (central) {
        /* 中心対称8方向に同じ線を刻み、生成的な曼荼羅模様を編む */
        const ax = w.x - f.CX, ay = w.y - f.CY;
        const bx = nx - f.CX, by = ny - f.CY;
        cx.save();
        cx.translate(f.CX, f.CY);
        cx.rotate(f.rotAcc * 0.5);
        cx.strokeStyle = `hsla(${h0 + w.hueOff} 90% ${55 + a.beatEnv * 20}% / .85)`;
        cx.lineWidth = lw * 0.7;
        cx.beginPath();
        for (let k = 0; k < 4; k++) {
          const th = (k * Math.PI) / 2;
          const c = Math.cos(th), s = Math.sin(th);
          /* 回転コピー */
          cx.moveTo(ax * c - ay * s, ax * s + ay * c);
          cx.lineTo(bx * c - by * s, bx * s + by * c);
          /* ミラーコピー(x反転)で万華鏡にする */
          cx.moveTo(-(ax * c - ay * s), ax * s + ay * c);
          cx.lineTo(-(bx * c - by * s), bx * s + by * c);
        }
        cx.stroke();
        cx.restore();
      } else {
        w.hist.push(nx, ny);
        if (w.hist.length > HIST * 2) w.hist.splice(0, w.hist.length - HIST * 2);
        f.sym(() => {
          /* 履歴ポリライン: 尾側は細く薄く、頭側は太く明るい2段描き */
          const half = Math.floor(w.hist.length / 4) * 2;
          cx.strokeStyle = `hsla(${h0 + w.hueOff} 90% 50% / .45)`;
          cx.lineWidth = lw * 0.6;
          cx.beginPath();
          cx.moveTo(w.hist[0], w.hist[1]);
          for (let i = 2; i <= half; i += 2) cx.lineTo(w.hist[i], w.hist[i + 1]);
          cx.stroke();
          cx.strokeStyle = `hsla(${h0 + w.hueOff} 92% ${62 + a.beatEnv * 15}% / .95)`;
          cx.lineWidth = lw;
          cx.beginPath();
          cx.moveTo(w.hist[half], w.hist[half + 1]);
          for (let i = half + 2; i < w.hist.length; i += 2) cx.lineTo(w.hist[i], w.hist[i + 1]);
          cx.stroke();
          /* 先端の光るヘッド */
          cx.fillStyle = `hsla(${h0 + w.hueOff + 20} 95% 80% / .95)`;
          cx.beginPath();
          cx.arc(nx, ny, lw * (0.9 + a.beatEnv * p.punch * 0.6), 0, Math.PI * 2);
          cx.fill();
        });
      }
      w.x = nx;
      w.y = ny;
      w.steps++;
      if (p.vari !== 2) {
        const turn = a.beat || Math.random() < 0.04 + a.treb * g * 0.1;
        if (turn) w.dir += Math.random() < 0.5 ? 1 : (central ? 7 : 3); /* 左右どちらかへ曲がる */
      }
      /* 画面外・中心から離れすぎ・長寿命でリスポーン */
      const dead = central
        ? Math.hypot(w.x - f.CX, w.y - f.CY) > Math.min(W, H) * 0.5 || w.steps > 500
        : w.x < -10 || w.x > W + 10 || w.y < -10 || w.y > H + 10 || w.steps > 700;
      if (dead) Object.assign(w, newWalker(f, central));
    }
  },
};
