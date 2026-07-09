import { on } from "../state/bus";
import { player } from "../audio/player";
import { playlist } from "../audio/playlist";

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

  const prevBtn = $<HTMLButtonElement>("prev");
  const nextBtn = $<HTMLButtonElement>("next");
  const shuffleBtn = $<HTMLButtonElement>("shuffle");

  playBtn.addEventListener("click", () => player.toggle());
  prevBtn.addEventListener("click", () => void playlist.prev());
  nextBtn.addEventListener("click", () => void playlist.next());
  shuffleBtn.addEventListener("click", () => playlist.toggleShuffle());

  const syncShuffle = (): void => {
    shuffleBtn.classList.toggle("on", playlist.shuffle);
  };

  on("player:state", () => {
    playBtn.textContent = player.playing ? "⏸" : "▶";
  });
  on("player:loaded", () => {
    $("tname").textContent = player.name;
  });
  on("track:changed", (id) => {
    const cur = playlist.list().find((t) => t.id === id);
    if (cur) $("tname").textContent = cur.name;
  });
  on("playlist:changed", syncShuffle);

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
