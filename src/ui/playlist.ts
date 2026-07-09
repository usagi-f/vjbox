import { on } from "../state/bus";
import { playlist } from "../audio/playlist";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

export function initPlaylist(): void {
  const listEl = $<HTMLOListElement>("pl-list");
  const shuffleBtn = $<HTMLButtonElement>("pl-shuffle");
  const addBtn = $<HTMLButtonElement>("pl-add");
  const input = $<HTMLInputElement>("file");

  let dragFrom = -1;

  function render(): void {
    const tracks = playlist.list();
    listEl.innerHTML = "";
    if (!tracks.length) {
      const empty = document.createElement("li");
      empty.className = "pl-empty";
      empty.textContent = "曲がありません。ドロップして追加";
      listEl.appendChild(empty);
    }
    tracks.forEach((t, i) => {
      const li = document.createElement("li");
      li.className = "pl-item";
      li.draggable = true;
      li.dataset.id = t.id;
      li.dataset.index = String(i);
      if (t.id === playlist.currentId) li.classList.add("on");

      const idx = document.createElement("span");
      idx.className = "pl-idx";
      idx.textContent = String(i + 1);

      const name = document.createElement("span");
      name.className = "pl-name";
      name.textContent = t.name;
      name.title = t.name;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "pl-del";
      del.dataset.del = t.id;
      del.textContent = "×";
      del.title = "除去";

      li.append(idx, name, del);
      listEl.appendChild(li);
    });
    shuffleBtn.classList.toggle("on", playlist.shuffle);
  }

  /* クリック委譲: × で除去、行で再生 */
  listEl.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const del = target.closest<HTMLButtonElement>("button[data-del]");
    if (del) {
      playlist.remove(del.dataset.del!);
      return;
    }
    const li = target.closest<HTMLElement>(".pl-item");
    if (li?.dataset.id) void playlist.playId(li.dataset.id);
  });

  /* ドラッグで並び替え */
  listEl.addEventListener("dragstart", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>(".pl-item");
    if (!li) return;
    dragFrom = Number(li.dataset.index);
    e.dataTransfer?.setData("text/plain", String(dragFrom));
    li.classList.add("dragging");
  });
  listEl.addEventListener("dragend", () => {
    dragFrom = -1;
    listEl.querySelectorAll(".pl-item").forEach((x) =>
      x.classList.remove("dragging", "drag-over"));
  });
  listEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    const li = (e.target as HTMLElement).closest<HTMLElement>(".pl-item");
    listEl.querySelectorAll(".pl-item").forEach((x) => x.classList.remove("drag-over"));
    if (li) li.classList.add("drag-over");
  });
  listEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const li = (e.target as HTMLElement).closest<HTMLElement>(".pl-item");
    if (dragFrom === -1 || !li) return;
    playlist.reorder(dragFrom, Number(li.dataset.index));
  });

  shuffleBtn.addEventListener("click", () => playlist.toggleShuffle());
  addBtn.addEventListener("click", () => input.click());

  on("playlist:changed", render);
  on("track:changed", render);
  render();
}
