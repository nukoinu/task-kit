---
description: "Use when proposing or writing pull request titles in this repository. Conventional Commits 形式で PR タイトルを日本語要約へ揃える。"
name: "Pull Request Title ルール"
---
# Pull Request Title ルール

## 目的
- PR タイトルを Conventional Commits 形式で揃え、変更の種類と対象を一目で判別できるようにする。

## 必須形式
- `<type>(<scope>): <summary>` を使う。
- `scope` が不要な場合は `<type>: <summary>` を使う。
- `summary` は日本語で 50 文字以内、末尾に句点を付けない。

## type
- `feat`: 機能追加
- `fix`: 不具合修正
- `docs`: ドキュメント更新
- `refactor`: 振る舞いを変えない整理
- `test`: テスト追加・修正
- `chore`: 雑務、設定、依存更新
- `build`: ビルド関連
- `ci`: CI 設定
- `perf`: 性能改善
- `style`: 体裁のみの修正
- `revert`: 差し戻し

## ルール
- type は変更の主目的で 1 つに絞る。
- scope は `docs`、`cli`、`collaboration` のような短い単位にする。
- summary には手段より結果を書く。
- "修正" や "更新" だけの曖昧な要約を避ける。
- 本文中心の PR でも、タイトルだけで差分の意図が判別できるようにする。

## 例
- `docs(collaboration): PR テンプレート運用を追加`
- `chore(github): Issue テンプレートを追加`
- `fix(cli): 空入力時のエラー処理を修正`

## チェック
- type が差分の主目的と一致している。
- scope が広すぎない。
- summary が具体的で、50 文字以内に収まっている。