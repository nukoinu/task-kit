<!-- task-kit:codex:start -->
## Task-Kit

- Task-Kit の共通状態とテンプレートは `.task-kit/` にある。
- Task-Kit の Codex skills は `.agents/skills/` にある。`.github/` を Task-Kit の実行資産として参照しない。
- タスク作成には `$task-kit-new-task`、定義更新には `$task-kit-task-update`、課題相談には `$task-kit-issue-consult` を使う。
- 計画の作成・更新には `$task-kit-plan-update` を使う。
- 承認済み計画の実行には `$task-kit-task-execute` を使う。
- 独立レビューには `$task-kit-review` を使う。
- `references/` は参照専用、`outputs/` は成果物、`records/` は判断・実施記録として扱う。
- Task-Kit 管理資産や Markdown を変更した場合は `task-kit lint` を実行する。安全な自動修正には `task-kit lint --fix` を使う。
<!-- task-kit:codex:end -->
