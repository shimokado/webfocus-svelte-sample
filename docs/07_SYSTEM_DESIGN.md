# WebFOCUS Svelte Sample - 実装設計書

本ドキュメントは、現在の実装に合わせた設計概要です。

## 1. 目的と前提

- WebFOCUS REST API を使い、レポート一覧と実行を提供する
- 同一 Origin 配信（approot）を基本とし、CORS を回避する
- `IBIRS_action` ごとの GET/POST を JSON 管理して切り替え可能にする

## 2. アーキテクチャ概要

```
UI (Svelte Components)
  ↓
State (Svelte Stores)
  ↓
API Client (src/api/webfocus.js)
  ↓
WebFOCUS REST API (/ibi_apps/rs)
```

## 3. 主要モジュール

### 3.1 API クライアント

場所: `src/api/webfocus.js`

責務:
- REST API 呼び出し
- XML レスポンス解析
- エラー時の統一形式返却

アクションごとのメソッド管理:

```javascript
const ACTION_METHODS = {
  signOn: 'GET',
  signOff: 'GET',
  get: 'GET',
  describeFex: 'GET',
  run: 'GET'
};
```

共通リクエスト生成:
- `buildActionParams()` で `IBIRS_action` と `IBIRS_service` を共通付与
- `buildRequest()` で GET/POST を切り替え

### 3.2 状態管理 (Stores)

場所: `src/stores/index.js`

- `auth`: ログイン状態と CSRF トークン
- `currentPath`: 現在の IBFS パス
- `contents`: フォルダ/レポート一覧
- `executionResult`: 実行結果

### 3.3 UI コンポーネント

場所: `src/components/`

- `Header.svelte`: ログイン/ログアウト
- `ReportBrowser.svelte`: フォルダ移動と一覧
- `ReportCard.svelte`: レポート実行ボタン
- `ParameterModal.svelte`: パラメータ入力
- `ResultModal.svelte`: 実行結果表示

## 4. データフロー

### 4.1 ログイン

1. `Header.svelte` で `signOn()` 実行
2. `auth` store 更新
3. `ReportBrowser.svelte` を表示

### 4.2 一覧取得

1. `ReportBrowser.svelte` が `getContents()` 呼び出し
2. XML から `rootObject > children > item` を解析
3. `MRFolder` / `FexFile` を判定してカード表示

### 4.3 レポート実行

- 通常実行: `runReport()`
- カスタム実行: `describeFex()` → `runReportWithParams()`

## 5. XML 解析の要点

- 成功判定: `ibfsrpc@returncode == 10000`
- 一覧取得:
  - `rootObject > children > item`
  - `type=MRFolder` をフォルダ扱い
  - `type=FexFile` または拡張子 `.fex` をレポート扱い
- `fullPath` があればパスに優先使用

## 6. 配信とアクセス

- デプロイ先: `c:\ibi\apps\svelte`
- アクセス URL: `http://localhost/approot/svelte/index.htm`
- `vite.config.js` の `base: './'` により相対パスで assets を解決

## 7. テスト方針

- E2E: Playwright
- コマンド:
  - `npm run test:e2e`
- 認証情報の上書き:
  - `WF_USER`, `WF_PASS`

テスト対象:
- approot でのページ表示
- ログイン後のカード表示

## 8. 運用メモ

- 同一 Origin 配信で CORS 回避
- Cross-Origin を使う場合は Security タブの Cross-Origin Settings を調整
- 設定変更後は Save → Clear Cache/Reload を実施

---

最終更新: 2026-02-18
