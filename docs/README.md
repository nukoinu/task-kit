# Task-Kit 現行設計書

## 1. 目的と適用範囲

Task-Kit は、GitHub Copilot、Codex、Claude Code で再現可能なタスク遂行フローを提供する配布キットである。Node.js CLI が製品別の実行資産と共通タスクテンプレートを展開する。

本書はリポジトリの現行実装と `templates/` を根拠にした配布仕様である。過去の要件定義、差分設計、用語運用の経緯は対象外とする。

## 2. 正本と責務

| 正本 | 責務 |
|---|---|
| `templates/github/` | `.github/agents` と `.github/prompts` に展開する資産 |
| `templates/skills/` | `.agents/skills` と `.claude/skills` に展開する、`.github` 非依存の Agent Skills |
| `templates/codex/AGENTS.md` | Codex 用の Task-Kit 管理コメント区間 |
| `templates/claude/CLAUDE.md` | Claude Code 用の Task-Kit 管理コメント区間 |
| `templates/.task-kit/` | `.task-kit` に展開する既定ファイルとタスクテンプレート |
| `cli/src/` | `init` / `switch` の引数解釈、展開、競合・同期削除、安全性検査 |
| `cli/test/` | CLI の展開・競合・同期・シンボリックリンク安全性の回帰検証 |

展開先の `.github/`、`.agents/`、`.claude/`、`.task-kit/`、`tasks/` は利用者ワークスペースの状態であり、配布正本ではない。

## 3. 前提条件

- Node.js 22.x
- Windows または macOS
- GitHub Copilot、Codex、Claude Code のうち利用対象となる実行環境

## 4. CLI

### 4.1 コマンド

```text
task-kit init [--copilot|--codex|--claude] [--force] [--sync]
task-kit switch [--copilot-to-codex|--copilot-to-claude] [--force] [--sync]
```

- `--copilot` は既定の Copilot 展開、`--codex` と `--claude` は製品別 skills 展開を選択する。
- `--force` は既存の配布管理ファイルを上書きする。
- `--sync` は選択製品で配布元にない既知の Task-Kit 管理資産を削除する。
- `switch` は移行先の展開成功後だけ Copilot の Task-Kit 管理資産を削除する。

展開先は実行時カレントディレクトリ直下の製品別ディレクトリと `.task-kit` である。任意の展開先を指定するオプションはない。

### 4.2 競合と同期

通常の `init` は、既存の配布対象ファイルを検出すると終了コード `5` で終了し、上書きしない。`--force` 指定時だけ上書きする。

既存の `AGENTS.md` / `CLAUDE.md` は競合扱いにせず、Task-Kit 管理コメント区間を末尾へ追記する。既存の管理区間を `--force` で更新する場合も、区間外の利用者記述は保持する。

`--sync` は、`task-kit.` 接頭辞を持つ既知のエージェント・プロンプト・スキル、および既知のタスクテンプレートだけを削除対象とする。利用者が追加したテンプレート、`tasks/`、`current-task.md`、`user-profile.md`、Task-Kit 管理対象外の資産は保持する。`--sync` 単独では競合ファイルを上書きせず、廃止資産の削除後に終了コード `5` を返す。`--force --sync` は上書きと削除の両方を行う。

コピー・削除の前には対象パスと親ディレクトリのシンボリックリンクを拒否し、リンク先を変更しない。

### 4.3 終了コード

| Code | 意味 |
|---:|---|
| 0 | 正常完了 |
| 1 | 入力エラー |
| 2 | パスまたは権限エラー |
| 3 | ネットワークエラー |
| 4 | プラン制約エラー |
| 5 | 競合エラー |
| 6 | 内部例外 |
| 7 | キャンセル |

## 5. 展開資産

### 5.1 製品別実行資産

| 役割 | エージェント | プロンプト |
|---|---|---|
| タスク管理 | `task-kit.task` | `new-task`、`task-update`、`issue-consult` |
| 計画 | `task-kit.plan` | `plan-update` |
| 実行 | `task-kit.execute` | `task-execute` |
| 独立レビュー | `task-kit.review` | `review` |

標準フローは `new-task` / `task-update` → `plan-update` → `task-execute` → `review` である。`issue-consult` は課題の整理と対応案の検討に使う。

Codex / Claude Code では `task-kit-new-task`、`task-kit-task-update`、`task-kit-plan-update`、`task-kit-task-execute`、`task-kit-review`、`task-kit-issue-consult` の Agent Skills を配布する。各 skill は対応する Copilot agent 本文と command prompt 本文を静的な自己完結契約として保持する。製品差分は呼び出し記法、添付参照、agent 委譲の skill 呼び出しへの読み替えだけとし、手順、停止条件、状態遷移、出力契約は省略しない。展開後の skill は別製品のテンプレートを実行時に参照しない。

`cli/test/skill-parity.test.js` は Copilot agent・prompt の frontmatter を除く契約本文が各 skill の対応区間と一致することを検証する。Copilot 側の契約を変更した場合は、対応 skill も同じ変更で更新しなければテストを失敗させる。

計画の確定後、計画担当は参照先中心の「実行セッションパッケージ」を提示し、利用者は新しいセッションで製品に対応した `task-kit-task-execute` 呼び出しを開始する。Copilot は `/task-kit.task-execute`、Claude Code は `/task-kit-task-execute`、Codex は `$task-kit-task-execute` を使う。パッケージにはタスクパス、依存関係が明確な連続ステップ群、一次入力の参照先、追加制約、検証差分だけを含める。初回パッケージなしの直接実行は書込み・状態遷移・外部操作をせず、パッケージ作成と新規セッション案内だけを行う。

### 5.2 タスク領域

`.task-kit` には以下を展開する。

```text
.task-kit/
├── current-task.md
├── defaults/user-profile.md
└── templates/tasks/
    ├── task.md
    ├── plan.md
    ├── review.md
    ├── issue.md
    ├── handoff.md
    ├── records/{findings.md,scratchpad.md}
    ├── references/.gitkeep
    └── outputs/.gitkeep
```

`new-task` は `tasks/YYYY/MM/DD/NNN-slug` を作成し、タスクテンプレート群を複製する。`current-task.md` はタスクパス未指定時の既定参照先であり、新規タスク作成時も利用者の同意がある場合だけ切り替える。`user-profile.md` は初回に確定した作成者と担当者を既定値として保存し、次回以降に再利用する。

実行セッション開始時、新規セッション時、または一次入力が変更された可能性がある場合は `plan.md` と `issue.md` を再確認する。同一セッション内で既読かつ変更がない一次入力は再読せず、変更対象、検証結果、`handoff.md` を中心に確認する。独立レビューは実行セッションと分離する。

### 5.3 ディレクトリ境界

| 場所 | 用途 | 操作 |
|---|---|---|
| `references/` | 参照資料 | 参照のみ |
| `outputs/` | 成果物 | 出力先未指定時の既定。タスク管理・実行で読書き可 |
| `records/findings.md` | 確定した事実、判断、懸念と根拠 | 新しい知見がある場合に追記 |
| `records/scratchpad.md` | 一時メモ・仮説 | タスク管理・実行で利用 |

レビューは独立性を守るため、レビュー対象やタスク状態を編集しない。`records/findings.md` への新規の事実・欠陥・根拠の追記だけを許可する。

## 6. 状態と成果物

タスクの状態は `未着手`、`計画済み`、`進行中`、`完了` を使い、`task.md` と `handoff.md` で整合させる。

- `new-task` は `未着手` で作成する。
- 実行可能な計画の確定時は `plan-update` が `計画済み` へ整合させる。
- 初回実行時は `task-execute` が `進行中` へ整合させる。
- `完了` は、全完了条件の検証結果、利用者の明示確認、確認日時が `task.md` に記録された場合だけ設定できる。

タスク定義は `task.md`、実行手順とレビュー要件は `plan.md`、タスク固有のレビュー仕様は `review.md`、課題は `issue.md`、引継ぎ情報は `handoff.md` に記録する。`review.md` がある場合、レビューはその観点・方法・受け入れ基準・優先度を最優先する。

## 7. 安全性と制約

- 秘密情報、資格情報、個人情報を成果物またはログに含めない。
- 成果物本文に Task-Kit の利用事実を混入しない。
- current task が空、不存在、または `tasks/` 配下の領域外の場合は対象を推測せず停止して確認する。
- 指定タスクと current task が異なる場合は、書込み前に対象を確認する。
- 実行は `plan.md` と `issue.md` を一次入力とし、重大な不整合、必須情報の不足、計画外の設計変更は推測で解決しない。

## 8. 検証

CLI 変更時は `cli` ディレクトリで以下を実行する。

```powershell
npm test
npm run check
```

テストは、製品別テンプレートの展開、Copilot と skills の契約同等性、instruction file への追記、移行、競合時の非削除、`--force`、`--sync` の削除範囲、利用者資産の保持、シンボリックリンク拒否、未知オプションを検証する。

## 9. 設計上の未解決事項

現行実装から判断できる未解決の設計事項はない。将来の展開先指定、双方向移行、オフライン運用、Agent Plugin 化は本書の対象外であり、採用する場合は実装に先立ち設計決定を行う。
