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
import { rings } from "./rings";
import { stars } from "./stars";
import { bars } from "./bars";
import { orbit } from "./orbit";
import { mesh } from "./mesh";
import { shards } from "./shards";
import { helix } from "./helix";
import { moire } from "./moire";
import { lasers } from "./lasers";
import { petals } from "./petals";
import { vortex } from "./vortex";
import { cometsMode } from "./comets";
import { diamonds } from "./diamonds";
import { typo } from "./typo";
import { pipes } from "./pipes";
import { nebula } from "./nebula";

/** モードを追加するとき: モジュールを作ってこの配列に足すだけでUI・オートに反映される */
export const MODES: VisualMode[] = [
  radial, particles, tunnel, waves,
  grid, lissa, burst, ridge,
  spiral, cubes, plexus, rain,
  glitch, blob, floor, flash,
  rings, stars, bars, orbit,
  mesh, shards, helix, moire,
  lasers, petals, vortex, cometsMode,
  diamonds, typo, pipes, nebula,
];

export const MODE_BY_ID = new Map(MODES.map((m) => [m.id, m]));
