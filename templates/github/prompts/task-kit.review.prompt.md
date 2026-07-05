---
description: "レビュー対象を重大度付きで評価し、修正提案を返す。"
name: "task-kit.review"
argument-hint: "タスクパス、レビュー対象、観点(任意)を入力してください"
agent: "task-kit.review"
---
# /task-kit.review

目的: レビュー実行を支援する。

## 入力
- タスクパス(必須)
- レビュー対象(必須)
- レビュー観点(任意)

## 手順
1. 観点省略時は標準観点を適用する。
2. 指摘は重大度順で列挙する。
3. 根拠と修正案をセットで提示する。
4. 結果を records/findings.md に追記する。

## 出力形式
- Findings(重大度順)
- Open Questions/Assumptions
- 残リスク

## 禁止事項
- 機密情報、資格情報、個人情報を記録しない。
- 成果物本文にタスクキット利用事実を混入しない。
