---
description: "新規タスク作業領域を作成する。日付階層と日次連番を前提に task.md などの初期ファイルを生成するための実行指示を組み立てる。"
name: "task-kit.new-task"
argument-hint: "タスクタイトルを入力してください"
agent: "task-kit.task"
---
# /task-kit.new-task

目的: 新規タスク作業領域を作成する。

## 入力
- タスクタイトル(任意。未指定時は対話で確認)

## 添付テンプレート
- #.task-kit/current-task.md
- #.task-kit/templates/tasks/task.md
- #.task-kit/templates/tasks/plan.md
- #.task-kit/templates/tasks/issue.md
- #.task-kit/templates/tasks/handoff.md
- #.task-kit/templates/tasks/records/findings.md
- #.task-kit/templates/tasks/records/scratchpad.md
- #.task-kit/templates/tasks/references/.gitkeep
- #.task-kit/templates/tasks/outputs/.gitkeep

## 手順
1. 対話形式で次の最低限項目を順にヒアリングし、不足があれば停止して確認する。
	- タイトル(必須): slug 候補を提示し、ユーザー確認後に確定する。
	- 目的・背景(必須)
	- 完了条件(必須、最低3件)
	- 期限(任意): 未指定時は当日を既定値にする。
	- 担当者(任意): `.task-kit/defaults/user-profile.md` に既定担当者があればそれを初期値に使う。なければヒアリングする。
	- 依頼者(任意): 未指定時は担当者と同じ値にする。
	- 作業方針・アプローチ(任意): task.md の「4. 作業方針・アプローチ」へ反映する。
2. 今日の日付で tasks/YYYY/MM/DD を対象にする。
3. 同日ディレクトリ配下で 3 桁連番の次番号を採番する。
4. 確定タイトルを slug 化して NNN-slug を作成する。
5. tasks/YYYY/MM/DD/NNN-slug を作成する。
6. 添付テンプレート(#.task-kit/templates/tasks/task.md など)を参照し、.task-kit/templates/tasks の配下構成を tasks/YYYY/MM/DD/NNN-slug に複製する。
7. ヒアリング結果を task.md の該当項目へ反映する。
	task.md のステータスは `未着手` とし、handoff.md の現在ステータスも同じ値にする。
8. ヒアリング済み入力をもとに、AI が想定されるリスクと課題候補を抽出し、task.md の「5. 想定されるリスク」へ反映する。
9. `.task-kit/defaults/user-profile.md` の既定担当者が未設定の場合のみ、担当者を初回値として保存する。
10. 新規タスク作成後、`.task-kit/current-task.md` を新規タスクへ切り替えるかユーザーに確認する。
11. ユーザー同意時のみ `.task-kit/current-task.md` を更新する。
12. 作成結果としてパスを返す。
13. `references/` は参照専用、`outputs/` は成果物、`records/` は判断・実施記録として作成後も用途を混在させないことを案内する。

## 出力形式
- 作成先パス
- 作成ファイル一覧
- 確定した入力値サマリー
- カレントタスク更新有無
- 注意事項(あれば)

## ディレクトリアクセス制約
- タスクディレクトリ配下の `outputs` と `records` は読み書き可とする。`references` は参照のみ可とし、書き込み(作成・更新・削除)を行わない。
- 出力先の明示がない場合は `outputs` を既定の出力先として扱う。

## 禁止事項
- 成果物本文にタスクキット利用事実を混入しない。



