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

## 手順
1. 添付テンプレート(#.task-kit/current-task.md, #.task-kit/templates/tasks/records/findings.md)を参照し、タスクパスを確定する。未指定時は `.task-kit/current-task.md` のタスクパスを使う。
2. 指定されたタスクパスと `.task-kit/current-task.md` のタスクパスが不一致の場合は、どちらを使うか確認してから進める。
3. タスク配下の `plan.md` を参照し、「5. レビュー」の `レビューの有無` `対象` `方法` を確認する。
4. `レビューの有無` が「不要」の場合はレビューを実施せず、その旨と理由を報告する。
5. `レビューの有無` が「要」の場合は、「5. レビュー」に記載された `対象` と `方法` に従ってレビューを実施する。
6. records/findings.md の存在を確認する。
7. 不足ファイルがある場合は .task-kit/templates/tasks から不足分を補完する。
8. `対象` または `方法` が未記載・不明確な場合に限り、観点省略時の標準観点を適用する。
9. 指摘は重大度順で列挙する。
10. 根拠と修正案をセットで提示する。
11. レビューで新しい事実や知見(新規に特定した不整合、欠陥、根拠)を発見した場合に records/findings.md へ追記する。

## 出力形式
- Findings(重大度順)
- Open Questions/Assumptions
- 残リスク

## ディレクトリアクセス制約
- タスクディレクトリ配下の `outputs` と `records` は読み書き可とする。`references` は参照のみ可とし、書き込み(作成・更新・削除)を行わない。
- 出力先の明示がない場合は `outputs` を既定の出力先として扱う。

## 禁止事項
- 成果物本文にタスクキット利用事実を混入しない。




