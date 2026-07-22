# Task-Kit

Task-Kit は、AI coding agent を使ったタスク遂行フローを再現可能にするための配布キットです。
CLI で GitHub Copilot、Codex、Claude Code 向けの実行資産と、共通の `.task-kit` テンプレートを配布します。

## できること

- `task-kit init` による製品別配布物の展開
- `task-kit switch` による Copilot から Codex / Claude Code への移行
- `.github` 配下へのエージェント定義とプロンプトの展開
- `.agents/skills` または `.claude/skills` 配下への独立した Agent Skills の展開
- `.task-kit` 配下へのタスク運用テンプレートと既定ファイルの展開
- タスク管理、計画、実行、独立レビューの役割を分離したエージェント構成の配布
- タスク作成、プラン更新、実行、レビューなどの運用フローを支えるチャット用プロンプトの配布

CLI は `task-kit init` と `task-kit switch` を提供します。タスク作成、更新、レビューなどの運用フローは、展開されるプロンプト、skills、テンプレートで支援します。

## 前提条件

- OS: Windows または macOS
- Node.js: 22.x(推奨: 22 LTS)
- ネットワーク接続: 必須(オフライン運用は対象外)
- 利用対象に応じて GitHub Copilot、Codex、Claude Code の実行環境

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
npm install -g https://github.com/<OWNER>/<REPO>/releases/download/v0.5.2/task-kit-cli-0.5.2.tgz
task-kit init
```

補足: GitHub Release を publish すると、`Release CLI Asset` ワークフローが
`.tgz` アセットを自動添付する。

展開先は製品に応じて `.github`、`.agents/skills`、`.claude/skills` のいずれかと、共通の `.task-kit` です。Codex ではルートの `AGENTS.md`、Claude Code では `CLAUDE.md` も管理コメント付きで作成または追記します。

配布正本は `templates/github/`、`templates/skills/`、`templates/codex/`、
`templates/claude/`、`templates/.task-kit/` です。`templates/skills/` は `.github` を参照しない
Codex / Claude Code 共通の Agent Skills 正本です。

## CLI コマンド

### task-kit init [--copilot|--codex|--claude] [--force] [--sync]

- `--copilot`: GitHub Copilot 用資産を展開。`init` の既定値
- `--codex`: `.agents/skills` と `AGENTS.md` を展開
- `--claude`: `.claude/skills` と `CLAUDE.md` を展開
- `--force`: 既存ファイル競合時に上書き
- `--sync`: 選択製品で配布元に存在しない既知の Task-Kit 管理資産を削除する。利用者独自資産には関与しない

### task-kit switch [--copilot-to-codex|--copilot-to-claude] [--force] [--sync]

移行先資産の展開に成功した後、`.github` 内の Task-Kit 管理エージェント、プロンプト、skills だけを削除します。他製品の `.github` 資産と `.task-kit` の利用者状態は保持します。

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

- `.github/agents/task-kit.task.agent.md`
- `.github/agents/task-kit.plan.agent.md`
- `.github/agents/task-kit.execute.agent.md`
- `.github/agents/task-kit.review.agent.md`
- `.github/prompts/task-kit.new-task.prompt.md`
- `.github/prompts/task-kit.task-update.prompt.md`
- `.github/prompts/task-kit.plan-update.prompt.md`
- `.github/prompts/task-kit.task-execute.prompt.md`
- `.github/prompts/task-kit.review.prompt.md`
- `.github/prompts/task-kit.issue-consult.prompt.md`

### Codex / Claude Code へ展開

- Codex: `.agents/skills/task-kit-{new-task,task-update,plan-update,task-execute,review,issue-consult}/SKILL.md` と `AGENTS.md`
- Claude Code: `.claude/skills/task-kit-{new-task,task-update,plan-update,task-execute,review,issue-consult}/SKILL.md` と `CLAUDE.md`

両製品の skills は `templates/skills` を正本とし、Copilot の `.github` 資産を参照しません。
各 skill には対応する Copilot agent と prompt の実行契約を省略せず格納し、製品差分は呼び出し記法と添付ファイルの読み方だけに限定します。`cli/test/skill-parity.test.js` は agent・prompt の契約本文と skills の一致を検証し、片側だけの変更を失敗として検出します。

### エージェントの構成

Copilot では 4 つの専任エージェントをチャット用プロンプトから呼び出します。Codex / Claude Code では6つの論理操作を一つずつ skill として提供します。

| エージェント | 主な責務 | 関連プロンプト |
|---|---|---|
| `task-kit.task` | タスクの起票・定義更新・課題相談。計画作成と実施は担当しない。 | `/task-kit.new-task`、`/task-kit.task-update`、`/task-kit.issue-consult` |
| `task-kit.plan` | 実行可能な `plan.md` とレビュー仕様を作成・更新する。 | `/task-kit.plan-update` |
| `task-kit.execute` | 承認済みの計画を根拠に実施、検証、記録する。 | `/task-kit.task-execute` |
| `task-kit.review` | 実装担当から独立してレビューし、重大度付きの指摘と修正提案を返す。 | `/task-kit.review` |

標準フローは、`new-task` / `task-update` → `plan-update` → `task-execute` → `review` です。`issue-consult` は課題の整理・対応案の検討に利用します。

実行可能な計画を確定した後は、`task-kit-task-execute` を明示した参照先中心の実行セッションパッケージを新しいセッションに貼り付けます。Copilot は `/task-kit.task-execute`、Codex は `$task-kit-task-execute`、Claude Code は `/task-kit-task-execute` で開始します。

### .task-kit へ展開

- `.task-kit/current-task.md`
- `.task-kit/defaults/user-profile.md`
- `.task-kit/templates/tasks/task.md`
- `.task-kit/templates/tasks/plan.md`
- `.task-kit/templates/tasks/review.md`
- `.task-kit/templates/tasks/issue.md`
- `.task-kit/templates/tasks/handoff.md`
- `.task-kit/templates/tasks/records/findings.md`
- `.task-kit/templates/tasks/records/scratchpad.md`
- `.task-kit/templates/tasks/references/.gitkeep`
- `.task-kit/templates/tasks/outputs/.gitkeep`

## 同梱されるワークフロー

- `/task-kit.new-task`
- `/task-kit.task-update`
- `/task-kit.plan-update`
- `/task-kit.task-execute`
- `/task-kit.review`
- `/task-kit.issue-consult`

Copilot では `.github/prompts`、Codex / Claude Code では `task-kit-new-task`、`task-kit-task-update`、`task-kit-plan-update`、`task-kit-task-execute`、`task-kit-review`、`task-kit-issue-consult` skills として同等の役割を配布します。skills は `.github` のファイルを実行時に参照しません。

製品ごとに呼び出し記法は異なりますが、同じ6論理操作に対応します。例: Copilot は `/task-kit.new-task`、Claude Code は `/task-kit-new-task`、Codex は `$task-kit-new-task` です。

## 含まれる運用ルールの例

`/task-kit.new-task` は対話形式で起票し、次を番号付きの一つの質問として最低限ヒアリングする。

- タイトル(slug 確認を含む)
- 目的・背景
- 完了条件
- 期限(未指定時は当日)
- 作成者(既定作成者があれば初期値として利用。未設定時は初回のみヒアリングして保存)
- 担当者(既定担当者があれば初期値として利用。未設定時はヒアリングして保存)
- 依頼者(未指定時は担当者と同値)
- 作業方針・アプローチ(任意)

想定されるリスクと課題候補は、ヒアリング済み入力をもとに AI が補完して `task.md` へ反映する。

既定作成者と既定担当者は `.task-kit/defaults/user-profile.md` に初回設定時のみ保存し、次回以降の `new-task` で再利用する。

新規タスク作成後は、`.task-kit/current-task.md` を新規タスクへ切り替えるかを確認し、同意時のみ更新する。

## current-task の運用ルール

- すべての専任エージェントは、実行前に `.task-kit/current-task.md` を参照してカレントタスクを把握する。
- タスクパス未指定時は、`.task-kit/current-task.md` のタスクパスを既定値として利用する。
- タスクパス指定値とカレントタスクが不一致の場合は、どちらを対象にするか確認してから実行する。

## 禁止事項

- 成果物(報告書を含む)に Task-Kit 利用事実を明示、記述、考察として混入しない
- 秘密情報、資格情報、個人情報を成果物またはログに含めない

## 参照資料

- 現行設計書: `docs/README.md`
- CLI 詳細: `cli/README.md`
- 変更履歴: `CHANGELOG.md`
