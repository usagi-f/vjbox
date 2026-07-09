# Default Playlist

Audio placed in this folder becomes the **default playlist**. When the page
loads, a **▶ Play default playlist** button appears on the landing screen, and
clicking it starts continuous playback.

## Adding tracks

1. Put audio files (`mp3`, or `wav` / `ogg` / `m4a`) in this folder (`public/tracks/`).
2. Add an entry for each file to the `tracks` array in `manifest.json`.

```json
{
  "tracks": [
    { "file": "01_intro.mp3", "name": "Intro" },
    { "file": "02_main.mp3",  "name": "Main Theme" }
  ]
}
```

- `file` — the file name relative to this folder (required).
- `name` — the label shown in the playlist (falls back to `file` when omitted).

When `tracks` is empty, there is no default playlist (playback works as before,
by dropping files).

## Notes

- Vite copies everything under `public/` verbatim into `dist/` at build time.
- The array order is the playback order for continuous playback.
- Mind the license (distribution and playback rights) of any files you commit.
