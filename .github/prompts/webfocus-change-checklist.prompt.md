---
description: 'WebFOCUS Svelte 変更時に、影響範囲確認から実装・ドキュメント更新までを一貫実行するためのプロンプト。'
---

# WebFOCUS Change Checklist Prompt

以下の順で作業してください。

1. `context7` で対象機能の関連ファイル（`src/api`, `src/components`, `src/stores`, `docs`）を調査する。
2. 必要なら `awesome-copilot` で instruction / agent を検索・読み込みする。
3. 最小差分で実装する（特に `src/api/webfocus.js` の責務境界を維持）。
4. テストまたは検証を実施する。
5. `README.md` と `docs/` を実装差分に合わせて更新する。
6. 変更内容とリスク、次の推奨アクションを短く報告する。
