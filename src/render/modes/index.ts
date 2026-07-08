import type { VisualMode } from "../context";
import { radial } from "./radial";
import { particles } from "./particles";
import { tunnel } from "./tunnel";
import { waves } from "./waves";
import { grid } from "./grid";
import { lissa } from "./lissa";
import { burst } from "./burst";
import { ridge } from "./ridge";
import { spiral } from "./spiral";
import { cubes } from "./cubes";
import { plexus } from "./plexus";
import { rain } from "./rain";
import { glitch } from "./glitch";
import { blob } from "./blob";
import { floor } from "./floor";
import { flash } from "./flash";

/** モードを追加するとき: モジュールを作ってこの配列に足すだけでUI・オートに反映される */
export const MODES: VisualMode[] = [
  radial, particles, tunnel, waves,
  grid, lissa, burst, ridge,
  spiral, cubes, plexus, rain,
  glitch, blob, floor, flash,
];

export const MODE_BY_ID = new Map(MODES.map((m) => [m.id, m]));
