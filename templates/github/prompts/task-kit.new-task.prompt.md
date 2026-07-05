---
description: "新規タスク作業領域を作成する。日付階層と日次連番を前提に task.md などの初期ファイルを生成するための実行指示を組み立てる。"
name: "task-kit.new-task"
argument-hint: "タスクタイトルを入力してください"
agent: "task-kit.task"
---
# /task-kit.new-task

目的: 新規タスク作業領域を作成する。

## 入力
- タスクタイトル(必須)

## 手順
1. タスクタイトルが空でないことを確認する。
2. 今日の日付で tasks/YYYY/MM/DD を対象にする。
3. 同日ディレクトリ配下で 3 桁連番の次番号を採番する。
4. タイトルを slug 化して NNN-slug を作成する。
5. tasks/YYYY/MM/DD/NNN-slug を作成する。
6. 次の初期ファイルを作成する。
   - task.md
   - plan.md
   - issue.md
   - handoff.md
   - records/findings.md
   - records/scratchpad.md
   - references/.gitkeep
   - outputs/.gitkeep
7. 作成結果としてパスを返す。

## 出力形式
- 作成先パス
- 作成ファイル一覧
- 注意事項(あれば)

## 禁止事項
- 機密情報、資格情報、個人情報を出力しない。
- 成果物本文にタスクキット利用事実を混入しない。
