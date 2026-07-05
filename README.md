# Task-Kit

Task-Kit は、VS Code workspace でタスク遂行フローを再現可能にするための配布キットです。
CLI で `.github` と `.task-kit` の運用資産を展開し、チャットコマンドでタスク作成から実行、レビュー、報告、引き継ぎまでを支援します。

## できること

- `task-kit init` による配布物展開
- タスク作成、修正、実行、アーカイブ
- プラン作成、修正、実行
- レビュー実行支援
- 報告書作成、課題管理、リスク検出
- 引き継ぎ資料作成
- Slack/Teams 向けリード文作成(投稿文生成まで)

## 前提条件

- OS: Windows または macOS
- VS Code: 1.102 以上
- Node.js: 22.x(推奨: 22 LTS)
- ネットワーク接続: 必須(オフライン運用は対象外)
- GitHub Copilot 有料プラン: 必須(無料プランは対象外)

## クイックスタート

リポジトリ直下で次を実行します。

```powershell
cd cli
npm install
npm run init
```

直接実行する場合:

```powershell
node src/index.js init
```

GitHub Releases から直接インストールする場合:

```powershell
npm install -g https://github.com/<OWNER>/<REPO>/releases/download/v0.1.0/task-kit-cli-0.1.0.tgz
task-kit init
```

補足: GitHub Release を publish すると、`Release CLI Asset` ワークフローが
`.tgz` アセットを自動添付する。

展開先は、コマンド実行ディレクトリ配下の `.github` と `.task-kit` です。

## CLI コマンド

### task-kit init [--copilot] [--force]

- `--copilot`: `init` と同一動作の別名オプション
- `--force`: 既存ファイル競合時に上書き

### 終了コード

| Code | 意味 |
|---|---|
| 0 | 正常完了 |
| 1 | 入力エラー |
| 2 | パス/権限エラー |
| 3 | ネットワークエラー |
| 4 | プラン制約エラー |
| 5 | 競合エラー |
| 6 | 内部例外 |
| 7 | キャンセル |

## 展開される主な資産

### .github へ展開

- `templates/github/agents/task-kit.task.agent.md`
- `templates/github/agents/task-kit.review.agent.md`
- `templates/.task-kit/prompts/task-kit.new-task.prompt.md`
- `templates/.task-kit/prompts/task-kit.task-update.prompt.md`
- `templates/.task-kit/prompts/task-kit.plan-update.prompt.md`
- `templates/.task-kit/prompts/task-kit.task-execute.prompt.md`
- `templates/.task-kit/prompts/task-kit.review.prompt.md`
- `templates/.task-kit/prompts/task-kit.issue-consult.prompt.md`

### .task-kit へ展開

- `templates/.task-kit/templates/tasks/task.md`
- `templates/.task-kit/templates/tasks/plan.md`
- `templates/.task-kit/templates/tasks/issue.md`
- `templates/.task-kit/templates/tasks/handoff.md`
- `templates/.task-kit/templates/tasks/records/findings.md`
- `templates/.task-kit/templates/tasks/records/scratchpad.md`
- `templates/.task-kit/current-task.md`

## チャットコマンド(設計上の運用コマンド)

- `/task-kit.new-task`
- `/task-kit.task-update`
- `/task-kit.plan-update`
- `/task-kit.task-execute`
- `/task-kit.review`
- `/task-kit.issue-consult`

## new-task の起票ルール

`/task-kit.new-task` は対話形式で起票し、次を最低限ヒアリングする。

- タイトル(slug 確認を含む)
- 目的・背景
- 完了条件
- 期限(未指定時は当日)
- 担当者(既定担当者があれば初期値として利用)
- 依頼者(未指定時は担当者と同値)
- 作業方針・アプローチ(任意)

想定されるリスクと課題候補は、ヒアリング済み入力をもとに AI が補完して `task.md` へ反映する。

既定担当者は `.task-kit/defaults/user-profile.md` で初回設定時のみ保存する。

新規タスク作成後は、`.task-kit/current-task.md` を新規タスクへ切り替えるかを確認し、同意時のみ更新する。

## current-task の運用ルール

- `task` 系および `review` エージェントは、実行前に `.task-kit/current-task.md` を参照してカレントタスクを把握する。
- タスクパス未指定時は、`.task-kit/current-task.md` のタスクパスを既定値として利用する。
- タスクパス指定値とカレントタスクが不一致の場合は、どちらを対象にするか確認してから実行する。

## 禁止事項

- 成果物(報告書を含む)に Task-Kit 利用事実を明示、記述、考察として混入しない
- 秘密情報、資格情報、個人情報を成果物またはログに含めない

## 参照資料

- 要件定義: `docs/design/task-kit-requirements-v1.0.md`
- 設計書: `docs/design/task-kit-solution-design-v1.0.md`
- CLI 詳細: `cli/README.md`