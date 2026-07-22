# Task-Kit リポジトリ開発ガイド

## 検証

CLI の依存関係をインストールした後、リポジトリ直下で次を実行する。

```powershell
cd cli
npm install
npm run check
```

Markdown のみを検証する場合は `npm run lint:md` を実行する。配布資産を変更した場合は、skills と templates の同期も確認する。

## 正本と同期

- 配布資産の正本はリポジトリ直下の `templates/` にある。
- `cli/templates/` はパッケージ作成時に生成されるため、直接編集しない。
- `templates/codex/AGENTS.md` と `templates/claude/CLAUDE.md` の管理コメント区間外は利用者記述として保持する。
- Agent Skills の契約を変更した場合は、対応する Copilot agent、prompt、skill の parity を確認する。

## Markdown lint

配布済み CLI の利用者プロジェクトでは、リポジトリ内の Markdown を次で検証する。

```text
task-kit lint
```

安全な自動修正を適用する場合は `task-kit lint --fix` を使う。
