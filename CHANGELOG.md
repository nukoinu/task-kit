# 変更履歴

## [0.5.2] - 2026-07-22

### 追加

- Copilot の実行契約と parity を保つ、Codex / Claude Code 共通の 6 つの Agent Skills を追加した。
- `task-kit lint [--fix] [paths...]` と Markdownlint 設定の配布を追加した。

### 変更

- Agent Skills を `new-task`、`task-update`、`plan-update`、`task-execute`、`review`、`issue-consult` の論理操作単位へ統一した。
- 配布パッケージ作成時に skills と templates を自動同期するようにした。
- Markdownlint を CLI の検証手順へ追加した。

## [0.5.1] - 2026-07-15

- CLI のバージョンを 0.5.1 に更新し、GitHub Releases からのインストール手順を更新した。
