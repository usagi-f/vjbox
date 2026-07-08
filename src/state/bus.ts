/** 最小のイベントバス。モジュール間の疎結合な通知に使う */
type Handler = (payload?: unknown) => void;

const handlers = new Map<string, Set<Handler>>();

export function on(event: string, fn: Handler): void {
  let set = handlers.get(event);
  if (!set) {
    set = new Set();
    handlers.set(event, set);
  }
  set.add(fn);
}

export function emit(event: string, payload?: unknown): void {
  handlers.get(event)?.forEach((fn) => fn(payload));
}
