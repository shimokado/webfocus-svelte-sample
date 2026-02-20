# WebFOCUS 改修チェックリスト

## 変更前

- `context7` で関連実装を確認したか
- 変更対象が `src/api/webfocus.js` に集約されるか確認したか
- 仕様参照（README / docs/01〜06）を確認したか

## 実装中

- API層とUI層の責務分離を維持しているか
- HTTPメソッド方針（ACTION_METHODS）を壊していないか
- 不要な機能追加や設計変更をしていないか

## 変更後

- README の該当記述を更新したか
- docs の該当ガイドを更新したか
- `awesome-copilot` で選んだ instruction の要件を満たしているか
