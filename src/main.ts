import "./style.css";
import { startRenderer } from "./render/renderer";
import { bindPlaying } from "./auto/director";
import { player } from "./audio/player";
import { playlist } from "./audio/playlist";
import { initPanel } from "./ui/panel";
import { initTransport } from "./ui/transport";
import { initDropzone } from "./ui/dropzone";
import { initPlaylist } from "./ui/playlist";
import { initIdle } from "./ui/idle";

bindPlaying(() => player.playing);
initPanel();
initTransport();
initDropzone();
initPlaylist();
initIdle();
startRenderer();
void playlist.loadManifest();
