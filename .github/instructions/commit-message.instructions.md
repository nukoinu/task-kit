---
description: "Use when creating git commit messages, proposing commit text, or preparing commit history. Enforce Conventional Commits format and quality checks."
name: "Commit Message Convention"
applyTo: "**"
---
# Commit Message Convention

Use Conventional Commits for all commit messages.
Write commit summaries and bodies in Japanese.

## Format

`<type>(<scope>): <summary>`

- `type`: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style`, `revert`
- `scope`: optional, short module name such as `api`, `ui`, `auth`
- `summary`: required, 50 characters or less, no trailing period, written in Japanese

## Rules

- Prefer one logical change per commit.
- Write summary and body in Japanese.
- Explain why in the body when context is not obvious.
- Wrap body lines around 72 characters.
- Use `BREAKING CHANGE:` footer for incompatible changes.
- Reference issues in footer when relevant, for example `Refs: #123`.

## Examples

- `feat(auth): トークン更新エンドポイントを追加`
- `fix(api): Webhook の空ペイロードを正しく処理`
- `docs(readme): ローカルセットアップ手順を追記`
- `refactor(ui): ダッシュボードカードを分割`
