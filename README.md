# VJBOX

An audio-reactive VJ visualizer that runs entirely in your browser.
Simply drop an audio file into the window to generate real-time visuals fully synchronized with spectral analysis and beat detection.
No server required. Features 100% client-side processing, ensuring your audio data never leaves your machine.

## Features

- **16 Visual Modes** — RADIAL / PRTCL / TUNNEL / WAVE / GRID / LISSA / BURST / RIDGE / SPIRAL / CUBES / PLEXUS / RAIN / GLITCH / BLOB / FLOOR / FLASH
- **Global Effects & Parameters** — Blending modes (Add / Screen / Normal / Difference), feedback types (OUT / IN / SPIN / DRIFT / MIR), texture overlays (Scanlines / Halftone), and a beat-synced strobe. Since these layer orthogonally over the visual modes, you can create thousands of unique combinations.
- **Real-Time GUI Control** — Adjust sensitivity, feedback trails, rotation, density, hue, kaleidoscope mirrors, and more via intuitive sliders.
- **Autopilot Mode** — Crossfades between visual modes automatically in sync with the beat at specified intervals. While running, parameters continuously and smoothly drift every 2 seconds to keep the performance dynamic.
- **Beat Detection** — Onset detection powered by moving-average comparisons of low-frequency energy.
- **Wall Projection Mode** — Full-screen mode automatically hides the UI after 3 seconds of inactivity.
- **Playlist** — Queue multiple tracks with continuous playback. Reorder by dragging, remove any track, shuffle, and skip forward/back. Drop several files at once to build a playlist, or ship a default playlist with the app (see below). Added tracks live for the session only — audio still never leaves your machine.

## Usage

Drag and drop one or more audio files (`mp3` / `wav` / `ogg` / `m4a`) — every file is appended to the playlist.

- `Space` — Play / Pause
- `⏮ / ⏭` — Previous / Next track
- `🔀` — Shuffle
- `×` (on a playlist row) — Remove that track; drag a row to reorder
- `⚡ RANDOMIZE` — Roll the dice on all parameters
- `Auto 8s/16s/32s` — Toggle Autopilot VJ mode

### Default Playlist

Ship audio with the app so anyone who opens the page can start continuous playback with one click:

1. Put audio files in `public/tracks/`.
2. List them in `public/tracks/manifest.json`:

   ```json
   { "tracks": [ { "file": "01_intro.mp3", "name": "Intro" } ] }
   ```

A **▶ Play default playlist** button then appears on the landing screen (a click is required because browsers block autoplay with sound). See `public/tracks/README.md` for details.

## Development

```bash
npm ci
npm run dev      # Start the local development server
npm run build    # Run type checks and build assets into dist/
npm run preview  # Preview the production build locally
```

## Architecture

```
src/
├─ main.ts               Entry point
├─ state/
│  ├─ bus.ts             Minimal event bus (loosely coupled notifications between modules)
│  └─ params.ts          Parameter store + Glide (smooth target-value interpolation)
├─ audio/
│  ├─ player.ts          Playback engine based on decodeAudioData
│  ├─ playlist.ts        Playlist controller (queue / reorder / shuffle / continuous play)
│  └─ analyzer.ts        FFT + Beat detection
├─ render/
│  ├─ renderer.ts        Rendering pipeline (FB → Trails → Mode → Texture → Strobe)
│  ├─ context.ts         Frame / VisualMode interfaces
│  └─ modes/             One file per mode. Easily add new ones by appending to the index.ts array
├─ auto/
│  └─ director.ts        Autopilot manager (mode transitions + parameter drifting)
└─ ui/                   panel / transport / dropzone / playlist / idle
```

Default playlist audio lives in `public/tracks/` (`manifest.json` + the audio files), copied verbatim into `dist/` by Vite.

Tech Stack: Built with Vite and TypeScript, featuring zero runtime dependencies.
Rendering is handled via Canvas 2D, and feedback loops are achieved through canvas self-copying.
The project uses `decodeAudioData` -> `AudioBufferSourceNode` for playback rather than a standard `<audio>` element. This ensures seamless operation even in embedded environments with strict Content Security Policies (CSP).

### Adding a New Visual Mode

1. Create a new file `src/render/modes/mymode.ts` and implement the `VisualMode` interface.
2. Register your mode by adding it to the `MODES` array in `src/render/modes/index.ts`.

That’s it! The new mode will be integrated into the UI buttons, Autopilot, and crossfading system automatically.

## License

MIT
