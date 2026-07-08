import { on, emit } from "../state/bus";
import { P, setNum, setDiscrete, type NumKey, type DiscreteKey } from "../state/params";
import { MODES } from "../render/modes";
import { randomizeAll, setInterval as setAutoInterval } from "../auto/director";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const NUM_KEYS: Array<{ key: NumKey; dec: number }> = [
  { key: "gain", dec: 2 }, { key: "trail", dec: 2 }, { key: "fb", dec: 2 },
  { key: "rot", dec: 2 }, { key: "dens", dec: 2 }, { key: "flow", dec: 2 },
  { key: "punch", dec: 2 }, { key: "strobe", dec: 2 },
];

const SEGS: Array<{ id: string; key: DiscreteKey }> = [
  { id: "sym", key: "sym" },
  { id: "blendseg", key: "blend" },
  { id: "fbseg", key: "fbStyle" },
  { id: "texseg", key: "tex" },
];

export function initPanel(): void {
  /* mode buttons: MODES から動的生成 */
  const modesEl = $("modes");
  for (const m of MODES) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.m = m.id;
    b.textContent = m.label;
    if (m.id === P.mode) b.classList.add("on");
    modesEl.appendChild(b);
  }
  modesEl.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-m]");
    if (!b) return;
    emit("mode:request", b.dataset.m);
  });
  on("mode:request", (id) => {
    modesEl.querySelectorAll("button").forEach((x) =>
      x.classList.toggle("on", x.dataset.m === id));
  });

  /* sliders */
  for (const { key, dec } of NUM_KEYS) {
    const el = $<HTMLInputElement>(`p-${key}`);
    const out = $<HTMLOutputElement>(`o-${key}`);
    el.addEventListener("input", () => {
      setNum(key, +el.value);
      out.textContent = (+el.value).toFixed(dec);
    });
  }
  const hueEl = $<HTMLInputElement>("p-hue");
  const hueOut = $<HTMLOutputElement>("o-hue");
  hueEl.addEventListener("input", () => {
    setNum("hue", +hueEl.value);
    hueOut.textContent = hueEl.value;
  });

  /* オート設定でグライド目標が変わったらスライダー表示を追従 */
  on("param:num", (payload) => {
    const { key, value } = payload as { key: NumKey; value: number };
    const el = document.getElementById(`p-${key}`) as HTMLInputElement | null;
    const out = document.getElementById(`o-${key}`) as HTMLOutputElement | null;
    if (!el || !out) return;
    if (key === "hue") {
      const disp = Math.round(((value % 360) + 360) % 360);
      el.value = String(disp);
      out.textContent = String(disp);
    } else {
      el.value = String(value);
      out.textContent = value.toFixed(2);
    }
  });

  /* segmented controls */
  for (const { id, key } of SEGS) {
    const root = $(id);
    root.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
      if (!b) return;
      const raw = b.dataset.v!;
      setDiscrete(key, (key === "sym" ? +raw : raw) as never);
    });
  }
  on("param:discrete", (payload) => {
    const { key, value } = payload as { key: DiscreteKey; value: unknown };
    const seg = SEGS.find((s) => s.key === key);
    if (!seg) return;
    document.querySelectorAll<HTMLButtonElement>(`#${seg.id} button[data-v]`).forEach((x) =>
      x.classList.toggle("on", x.dataset.v === String(value)));
  });

  /* auto interval */
  const autoseg = $("autoseg");
  autoseg.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-iv]");
    if (!b) return;
    setAutoInterval(+b.dataset.iv!);
    autoseg.querySelectorAll("button[data-iv]").forEach((x) =>
      x.classList.toggle("on", x === b));
  });

  /* randomize */
  $("rand").addEventListener("click", randomizeAll);

  /* HUD: beat LED + アクセント色同期 */
  const led = $("led");
  on("hud", (payload) => {
    const { beatOn, hue } = payload as { beatOn: boolean; hue: number };
    led.classList.toggle("on", beatOn);
    document.documentElement.style.setProperty("--acc", `hsl(${hue} 90% 60%)`);
  });

}
