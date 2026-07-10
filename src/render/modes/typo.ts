import { rnd, type Frame, type VisualMode } from "../context";

interface Glyph {
  ch: string; x: number; y: number; life: number; sz: number; hueOff: number; rot: number;
}

const GLYPHS = "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFXYZ#$%&*+<>▲◆●★";
/* 極太ゴシック系スタック。太さはフォント指定側の 900 で担保する */
const FONT = "'Arial Black','Helvetica Neue',Helvetica,'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif";
const glyphs: Glyph[] = [];
let centerCh = "V";
let centerPulse = 0;

function pick(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

function newGlyph(f: Frame, big: boolean): Glyph {
  return {
    ch: pick(),
    x: big ? f.CX : rnd(f.W * 0.1, f.W * 0.9),
    y: big ? f.CY : rnd(f.H * 0.15, f.H * 0.85),
    life: 1,
    sz: big ? rnd(0.35, 0.6) : rnd(0.05, 0.16),
    hueOff: rnd(-45, 45),
    rot: big ? rnd(-0.15, 0.15) : rnd(-0.6, 0.6),
  };
}

/** ビートで文字がフラッシュするタイポVJ。vari: 1=中央巨大 / 2=ランダム散布 / 3=タイプライター */
export const typo: VisualMode = {
  id: "typo",
  label: "TYPE",
  draw(f) {
    const { cx, W, H, DPR, a, p, t } = f;
    const h0 = f.hue();
    cx.globalCompositeOperation = p.blend;
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    if (p.vari === 3) {
      /* 行ごとに文字が打ち込まれていく */
      const cols = Math.floor(10 + p.dens * 16);
      const rows = Math.floor(6 + p.dens * 8);
      const cw = W / cols;
      const chH = H / rows;
      const total = cols * rows;
      const speed = 2 + a.level * p.gain * 14 + a.beatEnv * p.punch * 8;
      const head = Math.floor(t * speed * 0.12) % (total + Math.floor(total * 0.3));
      cx.font = `900 ${Math.floor(Math.min(cw, chH) * 0.72)}px ${FONT}`;
      for (let i = 0; i < Math.min(head, total); i++) {
        const gx = (i % cols + 0.5) * cw;
        const gy = (Math.floor(i / cols) + 0.5) * chH;
        /* 文字は座標から擬似ランダムに固定し、末尾側ほど明るく */
        const chIdx = Math.floor(Math.abs(Math.sin(i * 127.1 + Math.floor(t * 0.002))) * GLYPHS.length);
        const rec = 1 - Math.min(1, (head - i) / (total * 0.5));
        cx.fillStyle = `hsla(${h0 + rec * 60} 90% ${45 + rec * 35}% / ${0.3 + rec * 0.7})`;
        cx.fillText(GLYPHS[chIdx % GLYPHS.length], gx, gy);
      }
      /* カーソル */
      if (head < total && Math.floor(t * 0.1) % 2 === 0) {
        const gx = (head % cols + 0.5) * cw;
        const gy = (Math.floor(head / cols) + 0.5) * chH;
        cx.fillStyle = `hsl(${h0} 95% 75%)`;
        cx.fillRect(gx - cw * 0.3, gy - chH * 0.32, cw * 0.6, chH * 0.64);
      }
      return;
    }
    if (p.vari === 1) {
      /* 常に居座る中央の巨大文字。ビートで文字が切り替わり、残像エコーを飛ばす */
      if (a.beat) {
        centerCh = pick();
        centerPulse = 1;
        const n = 1 + Math.round(p.punch * 2);
        for (let i = 0; i < n; i++) {
          const echo = newGlyph(f, true);
          echo.ch = centerCh;
          glyphs.push(echo);
        }
      }
      centerPulse *= 0.9;
      const px = Math.min(W, H) * (0.42 + p.dens * 0.2) *
        (1 + a.bass * p.gain * 0.12 + centerPulse * p.punch * 0.22);
      cx.save();
      cx.translate(f.CX, f.CY);
      cx.rotate(Math.sin(t * 0.01) * 0.05 * (1 + Math.abs(p.rot) * 2));
      cx.font = `900 ${Math.floor(px)}px ${FONT}`;
      /* 色収差ふうに3層ずらして重ねる */
      const split = (2 + centerPulse * p.punch * 16 + a.level * p.gain * 4) * DPR;
      cx.fillStyle = `hsla(${(h0 + 300) % 360} 90% 55% / .5)`;
      cx.fillText(centerCh, -split, 0);
      cx.fillStyle = `hsla(${(h0 + 60) % 360} 90% 55% / .5)`;
      cx.fillText(centerCh, split, 0);
      cx.fillStyle = `hsla(${h0} 92% ${62 + centerPulse * 20}% / .92)`;
      cx.fillText(centerCh, 0, 0);
      cx.restore();
    } else if (a.beat) {
      const n = 2 + Math.round(p.punch * 4);
      for (let i = 0; i < n; i++) glyphs.push(newGlyph(f, false));
    }
    if (p.vari === 2 && glyphs.length < 4 + p.dens * 24 && Math.random() < a.treb * p.gain * 0.5) {
      glyphs.push(newGlyph(f, false));
    }
    for (let i = glyphs.length - 1; i >= 0; i--) {
      const s = glyphs[i];
      s.life -= p.vari === 1 ? 0.045 : 0.02;
      if (s.life <= 0) {
        glyphs.splice(i, 1);
        continue;
      }
      /* vari1 のエコーは拡大しながら薄れて飛んでいく */
      const grow = p.vari === 1 ? 1 + (1 - s.life) * 1.2 : 1 + (1 - s.life) * 0.25;
      const px = s.sz * Math.min(W, H) * grow * (1 + a.beatEnv * p.punch * 0.1);
      cx.save();
      cx.translate(s.x, s.y);
      cx.rotate(s.rot * (1 - s.life));
      cx.font = `900 ${Math.floor(px)}px ${FONT}`;
      cx.fillStyle = `hsla(${h0 + s.hueOff} 92% ${55 + s.life * 25}% / ${s.life * (p.vari === 1 ? 0.5 : 1)})`;
      cx.fillText(s.ch, 0, 0);
      cx.restore();
    }
  },
};
