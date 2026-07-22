---
description: "issue.md の課題をもとに解決助言と優先度提案を返す。"
name: "task-kit.issue-consult"
argument-hint: "タスクパスと課題IDまたは課題記述を入力してください"
agent: "task-kit.task"
---
# /task-kit.issue-consult

目的: 課題解決の助言を返す。

## 入力
- タスクパス(任意。未指定時は `.task-kit/current-task.md` を参照)
- 課題IDまたは課題記述(必須)

## 添付テンプレート
- #.task-kit/current-task.md
- #.task-kit/templates/tasks/issue.md
- #.task-kit/templates/tasks/records/findings.md

## 手順
1. 添付テンプレート(#.task-kit/current-task.md, #.task-kit/templates/tasks/issue.md, #.task-kit/templates/tasks/records/findings.md)を参照し、タスクパスを確定する。current task が空、不存在、または `tasks/` 配下のタスク領域外なら停止して確認する。未指定時は `.task-kit/current-task.md` のタスクパスを使う。
2. 指定されたタスクパスと `.task-kit/current-task.md` のタスクパスが不一致の場合は、どちらを使うか確認してから進める。
3. issue.md と records/findings.md の存在を確認する。
4. 不足ファイルがある場合は .task-kit/templates/tasks から不足分を補完する。
5. issue.md を確認して対象課題を特定する。
6. 課題ID指定時は該当課題を優先参照する。
7. 対応案、優先度、実施順序を可能な限り 3 案で提案する。各案には判断根拠を付ける。3 案未満となる場合は理由を明記する。
8. 新しい事実や知見を発見した場合のみ records/findings.md に判断根拠を追記する(例: 調査や Web 検索で新たに判明した情報)。追記時は日時（`YYYY-MM-DD HH:mm`、ローカル時刻）を必ず記録する。
9. `references/` は参照専用、`outputs/` は成果物、`records/` は判断・実施記録として用途を混在させない。

## 出力形式
- 課題整理
- 対応案(可能な限り3案、各案の根拠付き)
- 優先度提案
- 残リスク

## ディレクトリアクセス制約
- タスクディレクトリ配下の `outputs` と `records` は読み書き可とする。`references` は参照のみ可とし、書き込み(作成・更新・削除)を行わない。
- 出力先の明示がない場合は `outputs` を既定の出力先として扱う。

## 禁止事項
- 成果物本文にタスクキット利用事実を混入しない。




## Markdown の検証

- Markdown ファイルを作成または更新した場合は、リポジトリの Markdownlint 設定に従って変更対象を検証する。
- 自動修正によって文書の意味、Task-Kit テンプレート構造、frontmatter、管理コメント、状態、受け入れ基準を変更してはならない。
- 作業完了時には、今回作成・変更した Markdown へ Markdownlint 警告を残さない。意味上の変更が必要な場合は自動修正せず、停止または明示報告する。
