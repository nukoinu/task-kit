---
description: "plan.md の対象ステップ実行を支援し、記録ファイルへ結果を残す。"
name: "task-kit.task-execute"
argument-hint: "タスクパスと対象ステップ(任意)を入力してください"
agent: "task-kit.task"
---
# /task-kit.task-execute

目的: 計画実行を支援し、記録を更新する。

## 入力
- タスクパス(任意。未指定時は `.task-kit/current-task.md` を参照)
- 対象ステップ(任意)

## 添付テンプレート
- #.task-kit/current-task.md
- #.task-kit/templates/tasks/plan.md
- #.task-kit/templates/tasks/records/findings.md
- #.task-kit/templates/tasks/records/scratchpad.md
- #.task-kit/templates/tasks/outputs/.gitkeep

## 手順
1. 添付テンプレート(#.task-kit/current-task.md, #.task-kit/templates/tasks/plan.md, #.task-kit/templates/tasks/records/findings.md, #.task-kit/templates/tasks/records/scratchpad.md, #.task-kit/templates/tasks/outputs/.gitkeep)を参照し、タスクパスを確定する。current task が空、不存在、または `tasks/` 配下のタスク領域外なら停止して確認する。未指定時は `.task-kit/current-task.md` のタスクパスを使う。
2. 指定されたタスクパスと `.task-kit/current-task.md` のタスクパスが不一致の場合は、どちらを使うか確認してから進める。
3. plan.md、records/findings.md、records/scratchpad.md、outputs の存在を確認する。
4. 不足ファイルがある場合は .task-kit/templates/tasks から不足分を補完する。
5. plan.md の未完了ステップを確認する。
6. 対象ステップ指定がなければ未完了ステップを既定対象にする。
7. 実行中に新しい事実や知見を発見した場合のみ records/findings.md に記録する。作業メモは records/scratchpad.md に記録する。
8. 成果物の出力先は「自身への指示」→「plan.md の参照」→「outputs」の優先順で決定する。候補がタスクの意図と一致しない場合はユーザーに再確認する。
9. 実施手順に `references` 配下への出力や更新が含まれる場合は実行不可であることをユーザーへ伝え、`outputs` または `records` への代替案を提示する。
10. 初回実行時は task.md のステータスと handoff.md の現在地を `進行中` に更新する。`完了` は、task.md の「完了確認」に全完了条件の検証結果、利用者の明示確認、確認日時が記録済みの場合だけ更新する。

## 出力形式
- 実行対象
- 実行結果
- 次アクション

## ディレクトリアクセス制約
- タスクディレクトリ配下の `outputs` と `records` は読み書き可とする。`references` は参照のみ可とし、書き込み(作成・更新・削除)を行わない。
- 出力先は「自身への指示」→「plan.md の参照」→「outputs」の順で判断する。いずれも明示されない場合は `outputs` を既定の出力先とし、タスクの意図と一致しない場合はユーザーに再確認する。

## 禁止事項
- 成果物本文にタスクキット利用事実を混入しない。




