# Task Kit CLI 仕様

## 言語と推奨バージョン

- 言語: Node.js
- 推奨: Node.js 22 LTS
- サポート: Node.js 22.x
- 将来メジャー版は検証後にサポート対象へ追加する

## 実行方法

`cli` ディレクトリで以下を実行する。

```powershell
npm run init
```

もしくは直接実行:

```powershell
node src/index.js init
```

## GitHub Releases から直接インストール

リリースアセットの `.tgz` を使ってグローバルインストールできる。

```powershell
npm install -g https://github.com/<OWNER>/<REPO>/releases/download/v0.1.0/task-kit-cli-0.1.0.tgz
task-kit init
```

配布用アセット作成(リリース担当向け):

```powershell
cd cli
npm install
npm run pack:release
```

`npm run pack:release` は `templates/` を同梱した `.tgz` を生成する。

GitHub Release 公開時は `.github/workflows/release-cli.yml` により、
同アセットを自動生成してリリースへ添付する。

## コマンド

### `task-kit init [--copilot] [--force]`

- `--copilot`: `init` と同一動作の別名オプション。
- `--force`: 既存ファイル競合時に上書きする。
- 展開先: カレントディレクトリ配下の `.github` と `.task-kit`。

## 終了コード

- `0`: 正常完了
- `1`: 入力エラー(コマンド/オプション不正、必須指定不足)
- `2`: パス/権限エラー
- `3`: ネットワークエラー
- `4`: プラン制約エラー
- `5`: 競合エラー
- `6`: 内部例外
- `7`: キャンセル