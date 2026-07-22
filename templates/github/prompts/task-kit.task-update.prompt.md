---
description: "既存 task.md を更新し、変更理由と差分要約を残す。"
name: "task-kit.task-update"
argument-hint: "タスクパスと変更要求を入力してください"
agent: "task-kit.task"
---
# /task-kit.task-update

目的: タスク定義を更新する。

## 入力
- タスクパス(任意。未指定時は `.task-kit/current-task.md` を参照)
- 変更要求(必須)

## 添付テンプレート
- #.task-kit/current-task.md
- #.task-kit/templates/tasks/task.md
- #.task-kit/templates/tasks/records/findings.md

## 手順
1. 添付テンプレート(#.task-kit/current-task.md, #.task-kit/templates/tasks/task.md, #.task-kit/templates/tasks/records/findings.md)を参照し、タスクパスを確定する。current task が空、不存在、または `tasks/` 配下のタスク領域外なら停止して確認する。未指定時は `.task-kit/current-task.md` のタスクパスを使う。
2. 指定されたタスクパスと `.task-kit/current-task.md` のタスクパスが不一致の場合は、どちらを使うか確認してから進める。
3. タスクパス配下の task.md と records/findings.md の存在を確認する。
4. 不足ファイルがある場合は .task-kit/templates/tasks から不足分を補完する。
5. 変更要求を反映し、既存構成を維持して最小差分で更新する。
6. 変更履歴に更新内容を追記する。
7. 変更の過程で新しい事実や知見を発見した場合のみ、records/findings.md に要約と根拠を記録する。追記時は日時（`YYYY-MM-DD HH:mm`、ローカル時刻）を必ず記録する。
8. 状態を変更する場合は task.md と handoff.md の現在地を整合させる。`完了` は更新しない。

## 出力形式
- 更新対象
- 変更要約
- 影響範囲

## ディレクトリアクセス制約
- タスクディレクトリ配下の `outputs` と `records` は読み書き可とする。`references` は参照のみ可とし、書き込み(作成・更新・削除)を行わない。
- 出力先の明示がない場合は `outputs` を既定の出力先として扱う。

## 禁止事項
- 成果物本文にタスクキット利用事実を混入しない。




## Markdown の検証

- Markdown ファイルを作成または更新した場合は、リポジトリの Markdownlint 設定に従って変更対象を検証する。
- 自動修正によって文書の意味、Task-Kit テンプレート構造、frontmatter、管理コメント、状態、受け入れ基準を変更してはならない。
- 作業完了時には、今回作成・変更した Markdown へ Markdownlint 警告を残さない。意味上の変更が必要な場合は自動修正せず、停止または明示報告する。
