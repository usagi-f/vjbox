import { player } from "../audio/player";

/** 再生中にマウスを3秒放置するとUIとカーソルを隠す(壁投影用) */
export function initIdle(): void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function wake(): void {
    document.body.classList.remove("idle");
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (player.playing) document.body.classList.add("idle");
    }, 3200);
  }

  addEventListener("pointermove", wake);
  addEventListener("pointerdown", wake);
  wake();
}
