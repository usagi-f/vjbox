import { on } from "../state/bus";
import { playlist, isAudioFile } from "../audio/playlist";

export function initDropzone(): void {
  const drop = document.getElementById("drop")!;
  const zone = document.getElementById("zone")!;
  const input = document.getElementById("file") as HTMLInputElement;
  const startBtn = document.getElementById("drop-start") as HTMLButtonElement;

  function addFiles(files: File[]): void {
    const audio = files.filter(isAudioFile);
    if (!audio.length) return;
    zone.innerHTML = "<b>DECODING…</b>";
    try {
      playlist.add(audio);
    } catch (err) {
      console.error(err);
      zone.innerHTML =
        "<b>読み込みに失敗しました</b><br><small>mp3 / wav / ogg / m4a を試してください</small>";
    }
  }

  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    addFiles([...(input.files ?? [])]);
    input.value = "";
  });

  addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("over");
  });
  addEventListener("dragleave", () => drop.classList.remove("over"));
  addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("over");
    addFiles([...(e.dataTransfer?.files ?? [])]);
  });

  /* 標準プレイリストが読み込まれたら「▶ 標準再生」ボタンを出す */
  const refreshStart = (): void => {
    const builtin = playlist.list().filter((t) => t.src.kind === "url");
    if (builtin.length && playlist.currentId === null) {
      startBtn.hidden = false;
      startBtn.textContent = `▶ 標準プレイリストを再生 (${builtin.length}曲)`;
    } else {
      startBtn.hidden = true;
    }
  };
  startBtn.addEventListener("click", () => {
    const first = playlist.list().find((t) => t.src.kind === "url");
    if (first) void playlist.playId(first.id);
  });
  on("playlist:changed", refreshStart);
  on("track:changed", refreshStart);

  /* 何か1曲でも再生され始めたらドロップ画面を隠す */
  on("player:loaded", () => drop.classList.add("hidden"));
}
