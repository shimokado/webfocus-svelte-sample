# GitHub Copilot Instructions（Repository Level）

このリポジトリでは、GitHub Copilot は以下を優先して参照する。

## 基本方針

- 既存実装と docs を尊重し、最小差分で変更する。
- WebFOCUS REST API 連携は `src/api/webfocus.js` を単一の責務境界として扱う。
- UI 変更時は `src/components` と `src/stores` の責務分離を維持する。
- コード変更に追随して `README.md` と `docs/` を更新する。

## context7 / awesome-copilot 運用

- 実装前に `context7` で関連ファイル・既存仕様・影響範囲を確認する。
- 実装タスクが複雑な場合は `awesome-copilot` で instruction / agent を検索し、適切なものを読み込んでから着手する。
- 推奨順序: `context7` で現状把握 → `awesome-copilot` でテンプレート適用 → 実装 → テスト → ドキュメント更新。

## 参照先

- リポジトリ運用ガイド: `.github/instructions.md`
- 推奨 Skills 構成: `.github/skills.md`
- 追加 instruction: `.github/instructions/`
- 再利用 prompt: `.github/prompts/`
- カスタム chatmode: `.github/chatmodes/`
- カスタム agent: `.github/agents/`
- プロジェクト skill: `.github/skills/`
