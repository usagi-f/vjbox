import { rnd, type Frame, type VisualMode } from "../context";

interface Walker {
  x: number; y: number; dir: number; hueOff: number; steps: number;
}

const walkers: Walker[] = [];

function newWalker(f: Frame): Walker {
  return {
    x: rnd(f.W * 0.1, f.W * 0.9),
    y: rnd(f.H * 0.1, f.H * 0.9),
    dir: Math.floor(Math.random() * 4),
    hueOff: rnd(-40, 40),
    steps: 0,
  };
}

/** ネオンパイプが画面を這う。vari: 1=直交 / 2=斜め45° / 3=回路基板 */
export const pipes: VisualMode = {
  id: "pipes",
  label: "PIPES",
  draw(f) {
    const { cx, W, H, DPR, a, p } = f;
    const want = 3 + Math.floor(p.dens * 12);
    while (walkers.length < want) walkers.push(newWalker(f));
    if (walkers.length > want) walkers.length = want;

    const h0 = f.hue();
    const g = p.gain;
    const diag = p.vari === 2;
    const speed = (2.5 + a.level * g * 8 + a.beatEnv * p.punch * 5) * DPR;
    cx.globalCompositeOperation = p.blend;
    cx.lineCap = "round";
    f.sym(() => {
      for (const w of walkers) {
        /* 進行方向: 直交は90°刻み、斜めは45°刻みの対角のみ */
        const ang = diag
          ? (w.dir % 4) * (Math.PI / 2) + Math.PI / 4
          : (w.dir % 4) * (Math.PI / 2);
        const nx = w.x + Math.cos(ang) * speed;
        const ny = w.y + Math.sin(ang) * speed;
        cx.strokeStyle = `hsla(${h0 + w.hueOff} 90% ${55 + a.beatEnv * 20}% / .9)`;
        cx.lineWidth = (1.6 + a.bass * g * 3 + a.beatEnv * p.punch * 2) * DPR;
        cx.beginPath();
        cx.moveTo(w.x, w.y);
        cx.lineTo(nx, ny);
        cx.stroke();
        w.x = nx;
        w.y = ny;
        w.steps++;
        const turn = a.beat || Math.random() < 0.04 + a.treb * g * 0.1;
        if (turn) {
          w.dir += Math.random() < 0.5 ? 1 : 3; /* 左右どちらかへ曲がる */
          if (p.vari === 3) {
            /* 曲がり角にノードを打つ回路基板風 */
            cx.fillStyle = `hsla(${h0 + w.hueOff + 30} 92% 70% / .95)`;
            cx.beginPath();
            cx.arc(w.x, w.y, (2.2 + a.beatEnv * p.punch * 3) * DPR, 0, Math.PI * 2);
            cx.fill();
            cx.strokeStyle = `hsla(${h0 + w.hueOff} 90% 60% / .5)`;
            cx.lineWidth = 1 * DPR;
            cx.beginPath();
            cx.arc(w.x, w.y, (4.5 + a.beatEnv * p.punch * 3) * DPR, 0, Math.PI * 2);
            cx.stroke();
          }
        }
        /* 画面外か長寿命でリスポーン */
        if (w.x < -10 || w.x > W + 10 || w.y < -10 || w.y > H + 10 || w.steps > 700) {
          Object.assign(w, newWalker(f));
        }
      }
    });
  },
};
