import { on, emit } from "../state/bus";
import { player } from "./player";

export const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|flac|aac)$/i;

export const isAudioFile = (f: File): boolean =>
  f.type.startsWith("audio") || AUDIO_EXT.test(f.name);

export type TrackSource =
  | { kind: "url"; url: string }
  | { kind: "file"; file: File };

export interface Track {
  id: string;
  name: string;
  src: TrackSource;
}

/**
 * プレイリスト。曲の追加/除去/並び替え/シャッフルと連続再生を司る。
 * Player 本体はプレイリストを知らず、`player:ended` を購読して次曲へ進める。
 */
class Playlist {
  private tracks: Track[] = [];
  private _currentId: string | null = null;
  private _shuffle = false;

  constructor() {
    on("player:ended", () => void this.next());
  }

  list(): readonly Track[] {
    return this.tracks;
  }
  get currentId(): string | null {
    return this._currentId;
  }
  get shuffle(): boolean {
    return this._shuffle;
  }

  /** 同梱の標準プレイリストを manifest から読み込む。無ければ何もしない。 */
  async loadManifest(): Promise<void> {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}tracks/manifest.json`);
      if (!res.ok) return;
      const data = (await res.json()) as { tracks?: Array<{ file: string; name?: string }> };
      const entries = data.tracks ?? [];
      for (const e of entries) {
        if (!e || typeof e.file !== "string") continue;
        this.tracks.push({
          id: crypto.randomUUID(),
          name: e.name || e.file,
          src: { kind: "url", url: `${import.meta.env.BASE_URL}tracks/${e.file}` },
        });
      }
      if (entries.length) emit("playlist:changed");
    } catch {
      /* manifest 無し/壊れ = 標準プレイリスト空。正常系として無視 */
    }
  }

  /** ファイルを追加。未再生なら追加分の先頭から再生を始める。 */
  add(files: File[]): void {
    const audio = files.filter(isAudioFile);
    if (!audio.length) return;
    const added: Track[] = audio.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      src: { kind: "file", file },
    }));
    this.tracks.push(...added);
    emit("playlist:changed");
    if (this._currentId === null) void this.playId(added[0].id);
  }

  remove(id: string): void {
    const idx = this.tracks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const wasCurrent = this._currentId === id;
    const nextTrack = wasCurrent ? this.neighbourAfterRemoval(idx) : null;
    this.tracks.splice(idx, 1);
    if (wasCurrent) {
      this._currentId = null;
      if (nextTrack) void this.playId(nextTrack.id);
      else emit("track:changed", null);
    }
    emit("playlist:changed");
  }

  reorder(fromIndex: number, toIndex: number): void {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.tracks.length ||
      toIndex >= this.tracks.length
    ) {
      return;
    }
    const [moved] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, moved);
    emit("playlist:changed");
  }

  async playId(id: string): Promise<void> {
    const track = this.tracks.find((t) => t.id === id);
    if (!track) return;
    this._currentId = id;
    emit("track:changed", id);
    const data =
      track.src.kind === "file"
        ? await track.src.file.arrayBuffer()
        : await fetch(track.src.url).then((r) => r.arrayBuffer());
    await player.loadArrayBuffer(data, track.name);
  }

  async next(): Promise<void> {
    const target = this.pickAdjacent(1);
    if (target) await this.playId(target.id);
  }

  async prev(): Promise<void> {
    const target = this.pickAdjacent(-1);
    if (target) await this.playId(target.id);
  }

  toggleShuffle(): void {
    this._shuffle = !this._shuffle;
    emit("playlist:changed");
  }

  private currentIndex(): number {
    return this.tracks.findIndex((t) => t.id === this._currentId);
  }

  /** 除去された曲の次に再生すべき曲（無ければ null）を、splice 前に決める */
  private neighbourAfterRemoval(idx: number): Track | null {
    if (this.tracks.length <= 1) return null;
    return this.tracks[(idx + 1) % this.tracks.length] ?? null;
  }

  private pickAdjacent(dir: 1 | -1): Track | null {
    const n = this.tracks.length;
    if (n === 0) return null;
    if (n === 1) return this.tracks[0];
    if (this._shuffle) {
      const cur = this.currentIndex();
      let i = cur;
      while (i === cur) i = Math.floor(Math.random() * n);
      return this.tracks[i];
    }
    const cur = this.currentIndex();
    const base = cur === -1 ? (dir === 1 ? -1 : 0) : cur;
    return this.tracks[(base + dir + n) % n];
  }
}

export const playlist = new Playlist();
