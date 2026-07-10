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

### `task-kit init [--copilot] [--force] [--sync]`

- `--copilot`: `init` と同一動作の別名オプション。
- `--force`: 既存ファイル競合時に上書きする。
- `--sync`: 配布元に存在しない Task-Kit 管理資産を削除する。削除前確認は行わない。
- 展開先: カレントディレクトリ配下の `.github` と `.task-kit`。

`--sync` は `.github/agents/task-kit.*`、`.github/prompts/task-kit.*`、
`.github/skills/task-kit-*`、`.task-kit/prompts/task-kit.*`、および
`.task-kit/templates/` 配下の既知の Task-Kit 管理テンプレートだけを削除対象にする。
`.task-kit/templates/` に配置した利用者独自テンプレートには CLI は関与せず、
`tasks/`、`.task-kit/current-task.md`、`.task-kit/defaults/user-profile.md`、および
Task-Kit 接頭辞を持たない資産と同様に保持する。

`--sync` 単独では既存の配布対象を上書きしない。競合したファイルを表示し、
廃止資産の削除を実行したうえで終了コード `5` を返す。`--force --sync` は
上書きと削除を実行する。`current-task.md` と `user-profile.md` は `--force` 指定時も保持する。

## 終了コード

- `0`: 正常完了
- `1`: 入力エラー(コマンド/オプション不正、必須指定不足)
- `2`: パス/権限エラー
- `3`: ネットワークエラー
- `4`: プラン制約エラー
- `5`: 競合エラー
- `6`: 内部例外
- `7`: キャンセル