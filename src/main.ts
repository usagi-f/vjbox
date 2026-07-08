import "./style.css";
import { startRenderer } from "./render/renderer";
import { bindPlaying } from "./auto/director";
import { player } from "./audio/player";
import { initPanel } from "./ui/panel";
import { initTransport } from "./ui/transport";
import { initDropzone } from "./ui/dropzone";
import { initIdle } from "./ui/idle";

bindPlaying(() => player.playing);
initPanel();
initTransport();
initDropzone();
initIdle();
startRenderer();
