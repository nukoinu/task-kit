---
description: "レビュー対象を重大度付きで評価し、修正提案を返す。"
name: "task-kit.review"
argument-hint: "タスクパス、レビュー対象、観点(任意)を入力してください"
agent: "task-kit.review"
---
# /task-kit.review

目的: レビュー実行を支援する。

## 入力
- タスクパス(任意。未指定時は `.task-kit/current-task.md` を参照)
- レビュー対象(必須)
- レビュー観点(任意)

## 添付テンプレート
- #.task-kit/current-task.md
- #.task-kit/templates/tasks/records/findings.md
- #.task-kit/templates/tasks/review.md

## 手順
1. 添付テンプレート(#.task-kit/current-task.md, #.task-kit/templates/tasks/records/findings.md)を参照し、タスクパスを確定する。current task が空、不存在、または `tasks/` 配下のタスク領域外なら停止して確認する。未指定時は `.task-kit/current-task.md` のタスクパスを使う。
2. 指定されたタスクパスと `.task-kit/current-task.md` のタスクパスが不一致の場合は、どちらを使うか確認してから進める。
3. タスク配下の `plan.md` を参照し、「5. レビュー」の `レビューの有無` `対象` `方法` を確認する。
4. `レビューの有無` が「不要」の場合はレビューを実施せず、その旨と理由を報告する。
5. `レビューの有無` が「要」の場合は、タスク直下の `review.md` があればその確認観点、確認方法、受け入れ基準、優先度を優先し、なければ「5. レビュー」に記載された `対象` と `方法` に従ってレビューを実施する。
6. records/findings.md の存在を確認する。
7. 不足ファイルがある場合は .task-kit/templates/tasks から不足分を補完する。
8. `review.md` が存在せず、`対象` または `方法` が未記載・不明確な場合に限り、観点省略時の標準観点を適用する。
9. 指摘は重大度順で列挙する。
10. 根拠と修正案をセットで提示する。
11. レビューで新しい事実や知見(新規に特定した不整合、欠陥、根拠)を発見した場合に records/findings.md へ追記する。追記時は日時（`YYYY-MM-DD HH:mm`、ローカル時刻）を必ず記録する。
12. レビュー対象、状態、task.md、plan.md、issue.md、handoff.md、references/、outputs/、records/scratchpad.md は編集しない。findings.md への追記限定は自然言語による運用制約であり、技術的に強制されない。

## 出力形式
- Findings(重大度順)
- Open Questions/Assumptions
- 残リスク

通常の指摘は重要なものから最大5項目に絞り、詳細は records/findings.md または参照先へ記録する。ただし、Critical・High の指摘、未解決ブロッカー、利用者確認事項は省略しない。

## ディレクトリアクセス制約
- `references` と `outputs` は参照のみ可とし、書き込み(作成・更新・削除)を行わない。
- `records/findings.md` だけに新規の事実、欠陥、根拠を追記できる。ほかの `records/` は編集しない。

## 禁止事項
- 成果物本文にタスクキット利用事実を混入しない。




