---
description: "このリポジトリで .prompt.md を作成・更新するときに使う。frontmatter の必須/推奨キーと禁止キーを固定する。"
name: "Prompt Frontmatter ルール"
applyTo: ".github/prompts/*.prompt.md"
---
# Prompt Frontmatter ルール

## 目的
- `.prompt.md` の frontmatter を現行仕様に合わせ、読み込み不具合を防ぐ。

## ルール
- `mode` キーは使用しない。
- エージェント指定は `agent` キーを使用する。
- `agent` の値は `ask`、`agent`、`plan`、または既存のカスタムエージェント名を使う。
- `description` は用途が分かる文にする。
- 可能なら `name` と `argument-hint` を付与する。

## 推奨テンプレート
```yaml
---
description: "Use when ..."
name: "..."
argument-hint: "..."
agent: "ask"
---
```

## 検証チェック
- frontmatter が `---` で囲まれている。
- `mode` が含まれていない。
- `agent` が含まれている。
