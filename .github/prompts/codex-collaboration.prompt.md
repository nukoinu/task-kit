---
description: "Use this prompt to ask Codex to choose and invoke the right collaboration agent with a complete input set. 依頼内容から適切なエージェントを選び、不足情報を確認して実行する。"
name: "Codex Collaboration"
argument-hint: "依頼名、目的、対象成果物、成功条件、制約/禁止事項、参照資料を入力してください"
agent: "ask"
---
# Codex Collaboration Prompt

次の手順で実行してください。

1. 目的、対象、成功条件を固定する。
2. 不足情報があれば最大 3 点まで質問する。
3. 対象を 1 つに絞り、次の候補から最適なエージェントを選ぶ。
   - requirements-spec-coordinator
   - solution-designer
   - document-author
   - document-reviewer
4. `docs/templates/common-agent-input-template.md` に沿って入力を整理する。
5. 実行結果は次の形式で返す。
   - 選定エージェント
   - 入力要約
   - 実施結果
   - 未確定事項
   - 次の候補(必要時のみ)

## 入力
- 依頼名:
- 目的:
- 対象成果物:
- 成功条件:
- 制約/禁止事項:
- 参照資料:

## 例

### 例1: 要件の曖昧さを先に解消したい場合
- 依頼名: 用語レビュー基準の整理
- 目的: レビュー観点を統一し、見落としを減らす
- 対象成果物: docs/terminology/term-governance.md
- 成功条件:
   - 重大/軽微の判定基準が明文化されている
   - 例外ケースの扱いが記載されている
- 制約/禁止事項:
   - 既存の章構成は維持する
   - 用語定義の意味変更はしない
- 参照資料:
   - docs/terminology/misuse-log.md
   - docs/templates/common-agent-input-template.md
- 選定エージェントの想定: requirements-spec-coordinator

### 例2: 要件確定後に設計へ落とし込みたい場合
- 依頼名: 変更申請フローの設計整理
- 目的: 合意済み要件を実装前に画面、API、状態遷移へ分解する
- 対象成果物: 変更申請フローの設計メモ
- 成功条件:
   - 主要ユースケースごとの責務分割が明示されている
   - API と画面の境界が曖昧なく整理されている
   - 実装担当への引き継ぎ事項が列挙されている
- 制約/禁止事項:
   - 新規要件の追加確定は行わない
   - 既存 CLI の公開挙動は変更しない
- 参照資料:
   - 合意済み要件メモ
   - docs/templates/solution-design-template.md
- 選定エージェントの想定: solution-designer
