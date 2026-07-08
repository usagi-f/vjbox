# VJBOX

ブラウザだけで動くオーディオリアクティブVJビジュアライザ。
音楽ファイルをドロップすると、スペクトル解析とビート検出に連動した映像がリアルタイムに生成されます。
サーバー不要・完全クライアントサイド処理のため、音声データはどこにも送信されません。

## Features

- **16 visual modes** — RADIAL / PRTCL / TUNNEL / WAVE / GRID / LISSA / BURST / RIDGE / SPIRAL / CUBES / PLEXUS / RAIN / GLITCH / BLOB / FLOOR / FLASH
- **グローバル演出パラメータ** — 合成モード(加算/スクリーン/通常/差分)、フィードバック型(OUT/IN/SPIN/DRIFT/MIR)、質感オーバーレイ(走査線/網点)、ビートストロボ。モードと直交して掛け合わせられるため、組合せは数千通り
- **GUIリアルタイム操作** — 感度・残像・回転・密度・色相・万華鏡ミラーなどをスライダーで操作
- **オートパイロット** — 指定間隔でビートに同期してモードをクロスフェード切替。合間も2秒ごとにパラメータが滑らかに揺らぎ続ける
- **ビート検出** — 低域エネルギーの移動平均比較によるオンセット検出
- **壁投影モード** — フルスクリーン + 3秒放置でUI自動非表示

## Usage

https://&lt;username&gt;.github.io/vjbox/ を開き、音声ファイル(mp3/wav/ogg/m4a)をドロップするだけ。

- `Space` — 再生/停止
- `⚡ RANDOMIZE` — 全パラメータをガチャ
- `オート 8s/16s/32s` — 自動VJモード

## Development

```bash
npm ci
npm run dev      # 開発サーバー
npm run build    # 型チェック + dist/ へビルド
npm run preview  # ビルド結果の確認
```

## Architecture

```
src/
├─ main.ts               エントリポイント
├─ state/
│  ├─ bus.ts             最小イベントバス(モジュール間の疎結合通知)
│  └─ params.ts          パラメータストア + グライド(滑らかな目標値追従)
├─ audio/
│  ├─ player.ts          decodeAudioData ベースの再生エンジン
│  └─ analyzer.ts        FFT + ビート検出
├─ render/
│  ├─ renderer.ts        描画パイプライン(FB → 残像 → モード → 質感 → ストロボ)
│  ├─ context.ts         Frame / VisualMode インターフェース
│  └─ modes/             1ファイル1モード。index.ts の配列に足すだけで追加できる
├─ auto/
│  └─ director.ts        オートパイロット(モード切替 + パラメータ揺らぎ)
└─ ui/                   panel / transport / dropzone / idle
```

技術選定: Vite + TypeScript、ランタイム依存ゼロ。
描画は Canvas 2D で、フィードバックはキャンバス自己コピーで実現しています。
`<audio>` 要素を使わず `decodeAudioData` → `AudioBufferSourceNode` で再生しているのは、
CSP が厳しい埋め込み環境でも動作させるためです。

### モードの追加方法

1. `src/render/modes/mymode.ts` を作成し、`VisualMode` を実装する
2. `src/render/modes/index.ts` の `MODES` 配列に追加する

これだけでUIボタン・オートパイロット・クロスフェードすべてに自動で組み込まれます。

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` 同梱。以下の手順で公開できます。

1. GitHubにリポジトリを作成して push
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に変更
3. main に push するたびに自動でビルド & デプロイ

## License

MIT
