import { rnd, type VisualMode } from "../context";

interface Blip {
  ang: number; r: number; life: number; hueOff: number; sz: number;
}

const blips: Blip[] = [];
let sweep = 0;

/** レーダースコープ。vari: 1=クラシック掃引 / 2=トリプルアーム / 3=セクタースキャン */
export const radar: VisualMode = {
  id: "radar",
  label: "RADAR",
  draw(f) {
    const { cx, W, H, DPR, freq, a, p } = f;
    const h0 = f.hue();
    const g = p.gain;
    const R = Math.min(W, H) * 0.44 * (1 + a.beatEnv * p.punch * 0.12);
    const arms = p.vari === 2 ? 3 : 1;
    sweep += (0.022 + a.level * g * 0.05 + a.beatEnv * p.punch * 0.03) * (p.rot >= 0 ? 1 : -1);
    /* セクタースキャンは扇の中を往復する */
    const sector = Math.PI * 0.42;
    const armBase = p.vari === 3
      ? -Math.PI / 2 + Math.sin(sweep * 1.6) * sector
      : sweep;

    cx.globalCompositeOperation = p.blend;
    cx.save();
    cx.translate(f.CX, f.CY);
    cx.rotate(p.vari === 3 ? f.rotAcc * 0.15 : 0);

    /* レンジリングと十字線 */
    cx.strokeStyle = `hsla(${h0} 70% 55% / .18)`;
    cx.lineWidth = 1 * DPR;
    const nRings = 4;
    for (let i = 1; i <= nRings; i++) {
      cx.beginPath();
      cx.arc(0, 0, (R * i) / nRings, 0, Math.PI * 2);
      cx.stroke();
    }
    cx.beginPath();
    cx.moveTo(-R, 0); cx.lineTo(R, 0);
    cx.moveTo(0, -R); cx.lineTo(0, R);
    cx.stroke();
    /* 外周の目盛り */
    cx.strokeStyle = `hsla(${h0} 80% 60% / .4)`;
    cx.beginPath();
    for (let i = 0; i < 24; i++) {
      const ta = (i / 24) * Math.PI * 2;
      cx.moveTo(Math.cos(ta) * R, Math.sin(ta) * R);
      cx.lineTo(Math.cos(ta) * R * 1.04, Math.sin(ta) * R * 1.04);
    }
    cx.stroke();

    if (p.vari === 3) {
      /* 扇形のポーラースペクトラム: アームが掃く範囲に周波数の山を描く */
      const bars = 40;
      for (let i = 0; i < bars; i++) {
        const fr = i / (bars - 1);
        const ba = -Math.PI / 2 + (fr - 0.5) * 2 * sector;
        const fi = Math.floor(Math.pow(fr, 1.4) * freq.length * 0.55);
        const v = Math.min(1, (freq[fi] / 255) * g);
        if (v < 0.04) continue;
        cx.strokeStyle = `hsla(${h0 + fr * 70} 90% ${45 + v * 30}% / ${0.25 + v * 0.6})`;
        cx.lineWidth = ((R * sector * 2) / bars) * 0.55;
        cx.beginPath();
        cx.moveTo(Math.cos(ba) * R * 0.08, Math.sin(ba) * R * 0.08);
        cx.lineTo(Math.cos(ba) * R * v, Math.sin(ba) * R * v);
        cx.stroke();
      }
    }

    /* 掃引アーム: 残光の尾 + 明るい主線 */
    for (let k = 0; k < arms; k++) {
      const ang = armBase + (k * Math.PI * 2) / arms;
      for (let tr = 5; tr >= 0; tr--) {
        const ta = ang - tr * 0.045 * (p.rot >= 0 ? 1 : -1) * (p.vari === 3 ? Math.sign(Math.cos(sweep * 1.6)) : 1);
        const al = tr === 0 ? 0.95 : 0.3 * (1 - tr / 6);
        cx.strokeStyle = `hsla(${h0 + 20} 92% ${tr === 0 ? 70 : 55}% / ${al})`;
        cx.lineWidth = (tr === 0 ? 2.2 + a.beatEnv * p.punch * 3 : 5 - tr * 0.6) * DPR;
        cx.beginPath();
        cx.moveTo(0, 0);
        cx.lineTo(Math.cos(ta) * R, Math.sin(ta) * R);
        cx.stroke();
      }
    }

    /* ブリップ: アームの通過点に周波数の強い帯域が輝点として現れる */
    const tries = 2 + Math.floor(p.dens * 4);
    for (let i = 0; i < tries; i++) {
      const fi = Math.floor(Math.random() * freq.length * 0.6);
      const v = (freq[fi] / 255) * g;
      if (v < 0.5 || blips.length > 70) continue;
      const ang = armBase + (Math.floor(Math.random() * arms) * Math.PI * 2) / arms;
      blips.push({
        ang: ang + rnd(-0.04, 0.04),
        r: (0.15 + Math.pow(fi / (freq.length * 0.6), 0.75) * 0.82) * R,
        life: 1,
        hueOff: rnd(-20, 40),
        sz: (2 + v * 3.5) * DPR,
      });
    }
    for (let i = blips.length - 1; i >= 0; i--) {
      const b = blips[i];
      b.life -= 0.012 + (1 - p.trail) * 0.02;
      if (b.life <= 0) {
        blips.splice(i, 1);
        continue;
      }
      const x = Math.cos(b.ang) * b.r;
      const y = Math.sin(b.ang) * b.r;
      cx.fillStyle = `hsla(${h0 + b.hueOff} 92% ${55 + b.life * 25}% / ${b.life})`;
      cx.beginPath();
      cx.arc(x, y, b.sz * (0.6 + b.life * 0.6), 0, Math.PI * 2);
      cx.fill();
      /* 発見直後は波紋が一瞬広がる */
      if (b.life > 0.72) {
        cx.strokeStyle = `hsla(${h0 + b.hueOff} 92% 65% / ${(b.life - 0.72) * 2.5})`;
        cx.lineWidth = 1.2 * DPR;
        cx.beginPath();
        cx.arc(x, y, b.sz * (1 + (1 - b.life) * 14), 0, Math.PI * 2);
        cx.stroke();
      }
    }

    /* 中心のコア */
    cx.fillStyle = `hsla(${h0} 92% 70% / .9)`;
    cx.beginPath();
    cx.arc(0, 0, (2.5 + a.bass * g * 4 + a.beatEnv * p.punch * 3) * DPR, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  },
};
