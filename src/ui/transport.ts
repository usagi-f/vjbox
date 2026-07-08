import { on } from "../state/bus";
import { player } from "../audio/player";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const fmt = (sec: number): string => {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function initTransport(): void {
  const playBtn = $<HTMLButtonElement>("play");
  const seek = $<HTMLInputElement>("seek");
  const tt = $("ttime");
  const vol = $<HTMLInputElement>("vol");
  let seeking = false;

  playBtn.addEventListener("click", () => player.toggle());
  on("player:state", () => {
    playBtn.textContent = player.playing ? "⏸" : "▶";
  });
  on("player:loaded", () => {
    $("tname").textContent = player.name;
  });

  seek.addEventListener("pointerdown", () => { seeking = true; });
  seek.addEventListener("pointerup", () => {
    seeking = false;
    if (player.duration) player.seek((+seek.value / 1000) * player.duration);
  });
  seek.addEventListener("input", () => {
    if (player.duration) {
      tt.textContent = `${fmt((+seek.value / 1000) * player.duration)} / ${fmt(player.duration)}`;
    }
  });

  vol.addEventListener("input", () => player.setVolume(+vol.value));

  $("eject").addEventListener("click", () => {
    const input = $<HTMLInputElement>("file");
    input.value = "";
    input.click();
  });

  $("fs").addEventListener("click", () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  });

  addEventListener("keydown", (e) => {
    if (e.code === "Space" && player.loaded && (e.target as HTMLElement).tagName !== "INPUT") {
      e.preventDefault();
      player.toggle();
    }
  });

  on("hud", (payload) => {
    const { time, duration } = payload as { time: number; duration: number };
    if (!duration) return;
    tt.textContent = `${fmt(time)} / ${fmt(duration)}`;
    if (!seeking) seek.value = String((time / duration) * 1000);
  });
}
