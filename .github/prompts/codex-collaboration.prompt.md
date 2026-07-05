---
description: "Use this prompt to ask Codex to choose and invoke the right collaboration agent with a complete input set. 依頼内容から適切なエージェントを選び、不足情報を確認して実行する。"
agent: "ask"
---
# Codex Collaboration Prompt

次の手順で実行してください。

1. 目的、対象、成功条件を固定する。
2. 不足情報があれば最大 3 点まで質問する。
3. 対象を 1 つに絞り、次の候補から最適なエージェントを選ぶ。
   - requirements-spec-coordinator
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
