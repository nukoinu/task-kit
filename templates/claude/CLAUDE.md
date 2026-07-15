<!-- task-kit:claude:start -->
## Task-Kit

- Task-Kit の共通状態とテンプレートは `.task-kit/` にある。
- Task-Kit の Claude Code skills は `.claude/skills/` にある。`.github/` を Task-Kit の実行資産として参照しない。
- タスク作成には `/task-kit-task new-task`、定義更新には `/task-kit-task task-update`、課題相談には `/task-kit-task issue-consult` を使う。
- 計画の作成・更新には `/task-kit-plan` を使う。
- 承認済み計画の実行には `/task-kit-execute` を使う。
- 独立レビューには `/task-kit-review` を使う。
- `references/` は参照専用、`outputs/` は成果物、`records/` は判断・実施記録として扱う。
<!-- task-kit:claude:end -->
