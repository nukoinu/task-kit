# Task-Kit

Task-Kit は、VS Code workspace でタスク遂行フローを再現可能にするための配布キットです。
CLI で `.github` と `.task-kit` の運用資産を展開し、VS Code から利用するエージェント定義、プロンプト、テンプレートを配布します。

## できること

- `task-kit init` による配布物展開
- `.github` 配下へのエージェント定義とプロンプトの展開
- `.task-kit` 配下へのタスク運用テンプレートと既定ファイルの展開
- タスク管理、計画、実行、独立レビューの役割を分離したエージェント構成の配布
- タスク作成、プラン更新、実行、レビューなどの運用フローを支えるチャット用プロンプトの配布

現時点で CLI から実行できるコマンドは `task-kit init` のみです。タスク作成、更新、レビューなどの運用フローは、展開されるプロンプトとテンプレートで支援します。

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

配布正本は `templates/github/agents/`、`templates/github/prompts/`、
`templates/.task-kit/templates/tasks/` です。展開先の `.github/`、`.task-kit/`、
`tasks/` は配布正本ではありません。

## CLI コマンド

### task-kit init [--copilot] [--force] [--sync]

- `--copilot`: `init` と同一動作の別名オプション
- `--force`: 既存ファイル競合時に上書き
- `--sync`: 配布元に存在しない既知の Task-Kit 管理資産を削除する。`.task-kit/templates/` 配下の利用者独自テンプレートには関与しない。

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

### エージェントの構成

展開される 4 つの専任エージェントは、チャット用プロンプトから呼び出されます。役割を分離することで、タスク定義、計画、実行、レビューを混在させずに運用できます。

| エージェント | 主な責務 | 関連プロンプト |
|---|---|---|
| `task-kit.task` | タスクの起票・定義更新・課題相談。計画作成と実施は担当しない。 | `/task-kit.new-task`、`/task-kit.task-update`、`/task-kit.issue-consult` |
| `task-kit.plan` | 実行可能な `plan.md` とレビュー仕様を作成・更新する。 | `/task-kit.plan-update` |
| `task-kit.execute` | 承認済みの計画を根拠に実施、検証、記録する。 | `/task-kit.task-execute` |
| `task-kit.review` | 実装担当から独立してレビューし、重大度付きの指摘と修正提案を返す。 | `/task-kit.review` |

標準フローは、`new-task` / `task-update` → `plan-update` → `task-execute` → `review` です。`issue-consult` は課題の整理・対応案の検討に利用します。

`/task-kit.plan-update` で実行可能な計画を確定した後は、先頭行が `## 実行セッションパッケージ`、次行が `/task-kit.task-execute` の参照先中心パッケージを新しいセッションに貼り付けて実行します。パッケージは依存関係が明確な連続ステップ群を対象にし、同一セッション内では対象範囲と一次入力に実質的な変更がない限り継続実行できます。実行前には対象ステップ群の複雑度に応じたモデル層の推奨と利用者確認を行います。

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

## 同梱されるチャット用プロンプト

- `/task-kit.new-task`
- `/task-kit.task-update`
- `/task-kit.plan-update`
- `/task-kit.task-execute`
- `/task-kit.review`
- `/task-kit.issue-consult`

これらは `.github/prompts` と関連テンプレートとして展開され、VS Code 上の運用フローを支援します。CLI サブコマンドとしてはまだ実装していません。

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
