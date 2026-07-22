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
1. 最初の対話で、以下の項目を番号付きの一つの質問としてまとめてヒアリングする。項目ごとに順番に質問したり、slug の確認だけを別途求めたりしない。不足する必須項目がある場合だけ、不足項目を番号付きでまとめて再確認する。
	1. タイトル(必須): コマンド引数で指定済みならその値を使う。slug は確定タイトルから自動生成する。
	2. 目的・背景(必須)
	3. 完了条件(必須、推奨3件): 目的から逆算した具体的な候補を提示し、回答で修正できるようにする。
	4. 期限(任意): 省略時は当日を既定値として採用する。
	5. 作成者(条件付き): `.task-kit/defaults/user-profile.md` に既定作成者があれば省略可としてそれを採用する。既定作成者が未設定の場合は初回ヒアリングで必ず確定し、確定値を保存する。
	6. 担当者(条件付き): `.task-kit/defaults/user-profile.md` に既定担当者があれば省略可としてそれを採用する。既定担当者が未設定の場合はヒアリングで必ず確定し、確定値を保存する。
	7. 依頼者(任意): 省略時は担当者と同じ値を採用する。
	8. 作業方針・アプローチ(任意): 省略時は既定の方針を採用し、task.md の「4. 作業方針・アプローチ」へ反映する。
	最初のヒアリングでは、必須項目と条件付き項目を区別した記入例を一度だけ示し、既定値がある項目は「省略可（既定値を採用）」、既定値がない作成者・担当者は「初回設定のため必須」と明記する。
	確認待ちの応答は、確定内容、次の質問、入力例を中心に3行程度で返し、既出情報を繰り返さない。
2. 今日の日付で tasks/YYYY/MM/DD を対象にする。
3. 同日ディレクトリ配下で 3 桁連番の次番号を採番する。
4. 確定タイトルを slug 化して NNN-slug を作成する。
5. tasks/YYYY/MM/DD/NNN-slug を作成する。
6. 添付テンプレート(#.task-kit/templates/tasks/task.md など)を参照し、.task-kit/templates/tasks の配下構成を tasks/YYYY/MM/DD/NNN-slug に複製する。
7. ヒアリング結果を task.md の該当項目へ反映する。
	task.md のステータスは `未着手` とし、handoff.md の現在ステータスも同じ値にする。
8. ヒアリング済み入力をもとに、AI が想定されるリスクと課題候補を抽出し、task.md の「5. 想定されるリスク」へ反映する。
9. `.task-kit/defaults/user-profile.md` の既定作成者または既定担当者が未設定の場合のみ、それぞれ確定した値を初回値として保存する。既存の既定値は上書きしない。
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



## Markdown の検証

- Markdown ファイルを作成または更新した場合は、リポジトリの Markdownlint 設定に従って変更対象を検証する。
- 自動修正によって文書の意味、Task-Kit テンプレート構造、frontmatter、管理コメント、状態、受け入れ基準を変更してはならない。
- 作業完了時には、今回作成・変更した Markdown へ Markdownlint 警告を残さない。意味上の変更が必要な場合は自動修正せず、停止または明示報告する。
