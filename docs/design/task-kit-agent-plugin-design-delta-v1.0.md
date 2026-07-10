# Task-Kit Agent Plugin 追加設計書 v1.0

## 1. 基本情報

- 依頼名: Task-Kit Agent Plugin 方式追加設計
- 作成日: 2026-07-10
- 作成者: GitHub Copilot
- 対象システム/機能: Agent Plugin による Task-Kit 実行資産の配布と CLI 同期
- 本書の位置づけ: 既存の要件書および確定設計書に対する追加設計。既存文書の内容を変更・置換しない。
- 実装判断: 2026-07-10 に Agent Plugin 方式の実装を見送った。Plugin の prompt 認識方式と正本管理が未確定のため、本版では CLI 同期だけを実装対象とする。
- 関連要件: docs/design/task-kit-requirements-v1.0.md
- 関連設計: docs/design/task-kit-solution-design-v1.0.md
- 参考資料: https://code.visualstudio.com/docs/agent-customization/agent-plugins

### 1.1 後続差分との優先関係

テンプレート強化に関する実装根拠は、後続の
`docs/design/task-kit-template-enhancement-design-delta-v1.0.md` を最優先とする。
本書の 2 章から 10 章に残る Plugin、skills、`.task-kit/prompts` の記述は、
実装見送り前の将来検討資料であり、現在の実装根拠にしない。本書の CLI 同期に
関する記述も、後続差分設計と矛盾する場合は後続差分設計を優先する。

## 2. 目的と設計対象

### 2.1 解決したい課題

- 現在の対象は、CLI による workspace 資産の安全な展開・同期である。
- Agent Plugin 配布の課題は将来検討として保持し、今回の実装対象から除外する。

### 2.2 設計対象

- `task-kit init` によるカレントワークスペースへの初期展開
- `task-kit init --sync` による廃止済み Task-Kit 資産の同期削除
- `.github`、`.task-kit`、`tasks` の責務境界
- Task-Kit 固有接頭辞による他製品資産との共存
- 配布元テンプレートを網羅的に展開する成功条件

### 2.3 設計対象外

- `task-kit init --target <path>` のような任意展開先指定
- 既存の要件書・確定設計書の改訂
- Slack/Teams への自動投稿
- 外部 SaaS との双方向同期
- Agent Plugin、`plugin.json`、skills、`.task-kit/prompts` の追加
- Plugin の Hooks または MCP server の導入
- `tasks/` 配下にある利用者のタスク成果物の同期・削除

### 2.4 成功条件

- `task-kit init` はカレントディレクトリを対象に、配布元テンプレートに存在する資産を `.github` と `.task-kit` へ網羅的に展開できる。
- `task-kit init --sync` は、Task-Kit が管理する廃止済み資産だけを削除し、他製品の資産を保持できる。
- 既存タスク成果物を変更せずにテンプレートを更新できる。
- 固定ファイル数ではなく、配布元テンプレートの内容を配布契約の基準にできる。

## 3. 既存設計との差分

| 論点 | 既存設計 | 追加設計での扱い |
|---|---|---|
| 配布経路 | CLI による `.github`、`.task-kit` 展開 | CLI によるワークスペース初期化・同期を継続し、Plugin は見送る |
| 展開先 | カレントディレクトリの `.github`、`.task-kit` | 変更しない。`--target` は採用しない |
| 配布対象 | agents、prompts、`.task-kit` テンプレート | 現行の agents、prompts、`.task-kit` テンプレートを維持する |
| 成功条件 | 必要資産の展開 | 固定数を要求せず、配布元テンプレートを網羅展開 |
| 更新 | `--force` による上書き | `--sync` を追加し、廃止済みの Task-Kit 資産を削除 |
| 共存 | 明示的な削除境界なし | Task-Kit 固有接頭辞を持つ資産だけを管理 |
| タスクデータ | `.task-kit` と `tasks` を利用 | `tasks` は Plugin/CLI の同期対象外として保護 |

## 4. 設計方針

### 方針1: Agent Plugin は将来検討として保留する

Agent Plugin は prompt 認識方式と正本管理が未確定のため、今回の実装では追加しない。Plugin 関連の構成案は 5 章に将来検討資料として残す。

### 方針2: CLI の展開先はカレントディレクトリに固定する

`--target` などの任意ディレクトリ指定は採用しない。利用者が対象ワークスペースをカレントディレクトリにして CLI を実行する運用とする。

### 方針3: 配布元テンプレートを網羅展開する

配布対象のファイル数やファイル名を CLI の成功条件に固定しない。`templates/github` と `templates/.task-kit` の配下に存在するファイルおよびディレクトリを、規則に従ってすべて展開する。

### 方針4: 同期削除は Task-Kit 管理資産に限定する

`--sync` は配布元から削除された Task-Kit 資産を削除する。ただし、他製品の prompt、agent、skill、および利用者のタスク成果物は削除しない。

初期実装では Task-Kit 固有接頭辞を削除境界として利用する。管理対象を将来拡張する場合に備え、マニフェスト方式へ移行できる構造を維持する。

### 方針5: Plugin とワークスペースデータを分離する

Plugin は agent、prompt、skill の配布を担当する。`.task-kit` はワークスペース固有のテンプレート、設定、current task を保持し、`tasks` は利用者が作成したタスクと成果物を保持する。Plugin 更新で既存タスクを変更しない。

## 5. Plugin 構成（将来検討資料）

### 5.1 配布元 Plugin の構成案（実装見送り）

```text
task-kit-plugin/
  plugin.json
  agents/
    task-kit.task.agent.md
    task-kit.review.agent.md
  commands/
    task-kit.new-task.prompt.md
    task-kit.task-update.prompt.md
    task-kit.plan-update.prompt.md
    task-kit.task-execute.prompt.md
    task-kit.review.prompt.md
    task-kit.issue-consult.prompt.md
  skills/
    task-kit-workflow/
      SKILL.md
  templates/
    .task-kit/
      prompts/
      templates/
```

`commands` の正式な認識方式および `.prompt.md` の Plugin 内配置は、実装開始前に対象 VS Code 版で確認する。本版では確認結果が不足するため Plugin 実装を見送る。`.task-kit/prompts` と Plugin 資産の正本・生成関係も決定しない。

### 5.2 `plugin.json` の責務（将来検討）

```json
{
  "name": "task-kit",
  "description": "Task execution workflows for VS Code agent customization",
  "version": "1.0.0",
  "author": {
    "name": "Task-Kit maintainers"
  },
  "skills": "skills/",
  "agents": "agents/"
}
```

- `name` は小文字、数字、ハイフンだけで構成する。
- Plugin のバージョンは Plugin 資産の変更時に更新する。
- Hooks と MCP server は本追加設計の対象外とし、必要性が確定してから別設計に分離する。

## 6. CLI 同期仕様

### 6.1 コマンド

| コマンド | 目的 | 対象 | 備考 |
|---|---|---|---|
| `task-kit init` | 初期展開または通常更新 | カレントディレクトリ | 既存の `--force` を利用可能 |
| `task-kit init --sync` | 配布元と Task-Kit 管理資産を同期 | カレントディレクトリ | 廃止済み資産を削除 |
| `task-kit init --force --sync` | 上書きと同期削除を同時に実行 | カレントディレクトリ | 破壊的操作として結果を明示 |

`--target` はコマンド仕様に追加しない。

### 6.2 同期処理

1. 配布元テンプレートの相対パス一覧を取得する。
2. カレントディレクトリ配下の Task-Kit 管理対象を取得する。
3. 配布元に存在する資産を作成または更新する。
4. 配布元に存在せず、Task-Kit 管理対象として識別できる資産を削除する。
5. 他製品の資産および `tasks/` 配下のファイルを保持する。
6. 作成、更新、削除、競合、スキップの結果を表示する。

### 6.3 管理対象の命名規則

他製品との共存は固有接頭辞で区別する。標準の接頭辞は `task-kit` とする。

```text
.github/agents/task-kit.*
.github/prompts/task-kit.*
.github/skills/task-kit-*/
.task-kit/prompts/task-kit.*
```

`.task-kit/templates`、`.task-kit/defaults`、`.task-kit/current-task.md` は Task-Kit 専用領域として扱う。ただし、`current-task.md` は利用者の状態を保持するため、既存ファイルを通常の `init` で上書きしない。

### 6.4 `--force` と `--sync` の分離

- `--force`: 既存の配布対象ファイルを上書きする。
- `--sync`: 配布元にない Task-Kit 管理資産を削除する。削除前確認および dry-run は提供しない。
- `--sync` 単独: 競合する既存ファイルを上書きしない。
- `--force --sync`: 上書きと削除を実行し、削除一覧を必ず表示する。

### 6.5 保護対象

次の対象は CLI の同期削除対象外とする。

- `tasks/` 配下の全ファイル
- `.task-kit/current-task.md` の利用者変更内容
- `.task-kit/defaults/user-profile.md` の利用者設定
- Task-Kit 接頭辞を持たない `.github` 配下の資産
- Task-Kit 接頭辞を持たない `.task-kit/prompts` 配下の資産

## 7. 責務境界

| 領域 | 主責務 | 更新主体 |
|---|---|---|
| Agent Plugin | agent、prompt、skill の配布とバージョン管理 | Plugin 更新 |
| `.github` | VS Code が認識する workspace 資産 | CLI または利用者 |
| `.task-kit/prompts` | Task-Kit の補助 prompt、実行資産 | CLI または Plugin 初期化処理 |
| `.task-kit/templates` | タスク生成用テンプレート | CLI または利用者 |
| `.task-kit/current-task.md` | 現在のタスク参照 | チャットコマンド |
| `tasks/` | タスク、記録、成果物 | 利用者およびチャットコマンド |

同じ資産を Plugin と `.github` の双方で必須管理しない。Plugin を利用する場合の優先経路と、CLI のフォールバック経路は実装時に明示する。

## 8. 非機能・安全性

- Agent Plugin はローカルで agent、skill、Hooks、MCP server などを実行できるため、導入元と内容を確認してから有効化する。
- 本追加設計では Hooks と MCP server を含めないため、Plugin はファイルベースの agent、prompt、skill に限定する。
- Plugin 更新および CLI 同期で、秘密情報、資格情報、個人情報をログや成果物へ出力しない。
- 同期処理のログには、操作種別、相対パス、結果だけを記録する。
- 予期しない例外では、スタックトレースを利用者へそのまま表示しない。
- 削除処理は相対パスの境界を検証し、`tasks/` 外でも配布対象外の任意ファイルを削除しない。

## 9. トレードオフと未解決論点

| No | 種別 | 内容 | 判断理由/必要な確認 | 状態 |
|---|---|---|---|---|
| 1 | トレードオフ | Agent Plugin は Preview のため CLI を残す | Plugin 無効化や仕様変更時のフォールバックが必要 | 完了 |
| 2 | トレードオフ | 任意展開先を提供しない | カレントワークスペースを明示的な操作境界にする | 完了 |
| 3 | トレードオフ | 固有接頭辞で共存する | 他製品資産を保護しつつ実装を単純化する | 完了 |
| 4 | 見送り | Plugin 内の prompt 配置と認識方式 | 確認前に Plugin 実装を行わない | 見送り |
| 5 | 見送り | `.task-kit/prompts` の正本と Plugin 資産の関係 | Plugin 実装見送りに伴い対応しない | 見送り |
| 6 | 未解決 | 接頭辞変更時の廃止資産検出 | 将来は管理マニフェストが必要になる可能性がある | 未対応 |
| 7 | 決定 | `--sync` の競合時確認手順 | 削除前確認および dry-run は提供しない。競合は終了コード5で通知する | 完了 |

## 10. 実装引き継ぎ事項

### 実装開始条件

Plugin 実装を再開する場合だけ、対象 VS Code 版で Agent Plugin の prompt 認識と workspace ファイル参照を検証し、`templates/github/skills` と `templates/.task-kit/prompts` の具体的な資産一覧を確定する。

### 想定タスク分割

1. Plugin 再開時に最小構成と `plugin.json` を設計する。
2. Plugin 再開時に既存 agent、prompt と Plugin の配置を対応付ける。
3. Plugin 再開時に skills と `.task-kit/prompts` の標準資産を設計する。
4. CLI 同期の実装・テストは後続差分設計を根拠として実施する。

### テスト観点

- Plugin 再開時に `plugin.json` が認識されること。
- Plugin 再開時に agent、prompt、skill が VS Code 上で利用可能になること。
- `task-kit init` が配布元テンプレートを網羅展開すること。
- `task-kit init --sync` が廃止済み Task-Kit 資産だけを削除すること。
- 他製品の prompt、agent、skill が削除されないこと。
- `tasks/` と利用者設定が変更されないこと。
- `--force` なしの競合で終了コード 5 になること。
- `--target` が未知オプションとして終了コード 1 になること。
- 削除対象がパス境界外へ拡張されないこと。

## 11. 次アクション

1. Plugin 再開時に対象 VS Code 版で prompt 認識方式を検証する。
2. Plugin 再開時に `.task-kit/prompts` と Plugin 内資産の正本・生成関係を決定する。
3. 接頭辞変更を実施する場合は、管理マニフェスト方式への移行を設計する。

## 12. 既存文書との扱い

本書は差分設計書であり、次の既存文書を変更しない。

- docs/design/task-kit-requirements-v1.0.md
- docs/design/task-kit-solution-design-v1.0.md

既存文書との正式な統合や版数更新を行う場合は、別途変更承認を得たうえで、要件・設計・テンプレートの整合を確認する。
