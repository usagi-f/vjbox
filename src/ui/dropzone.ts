import { on } from "../state/bus";
import { player } from "../audio/player";

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|flac|aac)$/i;

export function initDropzone(): void {
  const drop = document.getElementById("drop")!;
  const zone = document.getElementById("zone")!;
  const input = document.getElementById("file") as HTMLInputElement;

  async function load(file: File | undefined | null): Promise<void> {
    if (!file) return;
    zone.innerHTML = "<b>DECODING…</b>";
    try {
      await player.load(file);
    } catch (err) {
      console.error(err);
      zone.innerHTML =
        "<b>読み込みに失敗しました</b><br><small>mp3 / wav / ogg / m4a を試してください</small>";
    }
  }

  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => void load(input.files?.[0]));

  addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("over");
  });
  addEventListener("dragleave", () => drop.classList.remove("over"));
  addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    const f = [...(e.dataTransfer?.files ?? [])].find(
      (f) => f.type.startsWith("audio") || AUDIO_EXT.test(f.name),
    );
    void load(f);
  });

  on("player:loaded", () => drop.classList.add("hidden"));
}
