---
description: "plan.md の対象ステップ実行を支援し、記録ファイルへ結果を残す。"
name: "Task Kit Task Execute"
argument-hint: "タスクパスと対象ステップ(任意)を入力してください"
agent: "task-kit.task"
---
# /task-kit.task-execute

目的: 計画実行を支援し、記録を更新する。

## 入力
- タスクパス(必須)
- 対象ステップ(任意)

## 手順
1. plan.md の未完了ステップを確認する。
2. 対象ステップ指定がなければ未完了ステップを既定対象にする。
3. 実行結果を records/findings.md と records/scratchpad.md に記録する。
4. 必要に応じて outputs 配下へ成果物を作成する。

## 出力形式
- 実行対象
- 実行結果
- 次アクション

## 禁止事項
- 機密情報、資格情報、個人情報を記録しない。
- 成果物本文にタスクキット利用事実を混入しない。
