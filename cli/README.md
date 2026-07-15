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
npm install -g https://github.com/<OWNER>/<REPO>/releases/download/v0.5.1/task-kit-cli-0.5.1.tgz
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

### `task-kit init [--copilot|--codex|--claude] [--force] [--sync]`

- `--copilot`: GitHub Copilot 用資産を展開する既定値。
- `--codex`: `.agents/skills` とルート `AGENTS.md` を展開する。
- `--claude`: `.claude/skills` とルート `CLAUDE.md` を展開する。
- `--force`: 既存ファイル競合時に上書きする。
- `--sync`: 選択製品で配布元に存在しない Task-Kit 管理資産を削除する。削除前確認は行わない。
- 共通展開先: カレントディレクトリ配下の `.task-kit`。

既存 `AGENTS.md` / `CLAUDE.md` には、製品別の Task-Kit 管理コメントで囲んだ区間を末尾へ追記する。`--force` は管理区間だけを更新し、利用者が記述した他の内容を変更しない。

### `task-kit switch [--copilot-to-codex|--copilot-to-claude] [--force] [--sync]`

移行先の skills と instruction file を展開した後、`.github` 内の `task-kit.*` と `task-kit-*` の管理資産だけを削除する。移行先で競合した場合は終了コード `5` を返し、Copilot 管理資産を削除しない。

`--sync` は選択製品の `.github/agents/task-kit.*`、`.github/prompts/task-kit.*`、
`.github/skills/task-kit-*`、`.agents/skills/task-kit-*`、`.claude/skills/task-kit-*`、`.task-kit/prompts/task-kit.*`、および
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
