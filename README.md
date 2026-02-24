# WebFOCUS Svelte Sample

WebFOCUS REST API を使用してレポート一覧を取得し、Svelteで構築したモダンなWebアプリケーションです。
ログイン後、カード型で表示されたレポートを実行でき、通常実行と詳細確認の2種類の実行方法をサポートしています。

## 機能

### 1. ユーザー認証
- WebFOCUS REST API (`signOn`) を使用したログイン
- セッション管理とCSRFトークン自動ハンドリング
- サインオフ（ログアウト）機能

### 2. レポート管理
- **レポート一覧表示**: 「IBFS:/WFC/Repository/reports」フォルダのコンテンツをカード型で表示
- **フォルダナビゲーション**: フォルダを掘り下げて閲覧可能
- **パンくずリスト**: 現在位置を表示し、階層を戻ることが可能
- **更新機能**: ボタンで最新のコンテンツを再取得

### 3. レポート実行

#### 通常実行（▶ 実行ボタン）
レポートをパラメータなしで直接実行し、結果を別タブで表示します。
- `IBIRS_action=run` API を使用

#### 詳細確認（⚙ 詳細ボタン）
レポートの定義情報を取得し、別タブで表示します。
- `IBIRS_action=describeFex` でレポートの定義を取得
- REST API レスポンス（XML）を別タブで確認可能

### 4. 実行結果表示
- 実行結果はアプリ内ダイアログではなく、ブラウザの別タブで表示
- `▶ 実行`: `run` の結果を別タブ表示
- `⚙ 詳細`: `describeFex` の結果を別タブ表示
- `📄 properties`: `properties` を別タブ表示（カード固有の `IBIRS_path`）
- `📦 getContent`: `getContent` を別タブ表示（カード固有の `IBIRS_path`）
- `🔍 getDetails`: `getDetails` を別タブ表示（`IBIRS_service=describe`）

## 技術スタック

- **フロントエンドフレームワーク**: [Svelte 4](https://svelte.dev/)
- **ビルドツール**: [Vite 5](https://vitejs.dev/)
- **スタイリング**: [Tailwind CSS 3](https://tailwindcss.com/)
- **状態管理**: Svelte Stores
- **バックエンド API**: WebFOCUS REST API (v9.3.3)
- **通信**: Fetch API + XMLパース

## ディレクトリ構成

```
webfocus-svelte-sample/
├── index.html              # メインHTML
├── vite.config.js         # Vite設定（プロキシ設定含む）
├── tailwind.config.js     # Tailwind CSS設定
├── postcss.config.js      # PostCSS設定
├── package.json           # 依存関係定義
├── .gitignore
├── README.md              # このファイル
└── src/
    ├── main.js            # エントリーポイント
    ├── App.svelte         # ルートコンポーネント
    ├── app.css            # グローバルCSS + Tailwind directives
    ├── api/
    │   └── webfocus.js    # WebFOCUS REST APIクライアント
    ├── stores/
    │   └── index.js       # Svelte Stores（認証、パス、コンテンツ）
    └── components/
        ├── Header.svelte        # ヘッダー＋ログインフォーム
        ├── ReportBrowser.svelte # レポート一覧＋ナビゲーション
        ├── ReportCard.svelte    # レポートカード（実行ボタン）
        ├── ParameterModal.svelte # （互換維持用）未使用
        └── ResultModal.svelte    # （互換維持用）未使用
```

## セットアップと実行

### 前提条件
- Node.js 18以上
- WebFOCUSサーバーが localhost で動作中

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

**注意**: WebFOCUS REST API はデフォルトでは CORS が有効ではないため、Vite の開発サーバーで プロキシ設定を使用しています。
（`/ibi_apps` → `http://localhost/ibi_apps`）

### ビルド

```bash
npm run build
```

`dist/` フォルダに本番用のファイルが生成されます。

### デプロイ

```bash
npm run deploy
```

このコマンドはビルドを実行し、生成されたファイルを `c:\ibi\apps\svelte` にコピーします。
（Windows環境向けのコマンドです）

### デプロイ後のアクセス

ビルド後に `c:\ibi\apps\svelte` へデプロイすると、以下の URL でアクセスできます。

```
http://localhost/approot/svelte/index.htm
```

このアクセス方法であれば WebFOCUS の CORS 制限がかからず、POST メソッドが必要な場合は必須です。

### テスト

E2E テストは Playwright を使用します。

```bash
npm run test:e2e
```

認証情報は環境変数で上書きできます。

```bash
$env:WF_USER="admin"
$env:WF_PASS="admin"
npm run test:e2e
```

## WebFOCUS REST API との連携

### REST API サンプルページ

以下の手順で WebFOCUS REST API のテストページに移動できます。

1. ログイン

```
http://localhost/ibi_apps/rs?IBIRS_action=signOn&IBIRS_userName=admin&IBIRS_password=admin&IBIRS_service=ibfs
```

2. テストページを開く

```
http://localhost/ibi_apps/rs?IBIRS_action=TEST
```

### ログイン（signOn）

```javascript
// src/api/webfocus.js の signOn() 関数
GET /ibi_apps/rs
Parameters:
  - IBIRS_action=signOn
  - IBIRS_userName=<username>
  - IBIRS_password=<password>

Response: XML形式で CSRFトークンを含む
```

### HTTP メソッドの方針

- GET リクエストで実行可能なものは GET を使用
- signOn は本来 POST だが、本開発では GET で実装
- `IBIRS_action` ごとの GET/POST は `src/api/webfocus.js` の `ACTION_METHODS` で JSON 管理

### WebFOCUS セキュリティ設定の注意点

管理コンソール（Security タブ）で確認できるポイント:

- **Cross-Origin Settings**（Authentication ページ）
  - Allow Embedding: iframe 埋め込み可否
  - Allow Cross-Origin Resources Sharing (CORS): Ajax のクロスオリジン許可
  - Allowed Origins: 許可する Origin をカンマ区切りで指定（scheme/host/port 必須）
- **Allowed Host Names**（Authentication Options）
  - Host ヘッダ検証の許可リスト
  - `*` は全許可。運用ではホワイトリスト推奨
- **Security Zones**
  - Default/Mobile/Portlet/Alternate の各ゾーンで設定が独立
  - Cross-Origin の設定もゾーン単位

参照: http://localhost/ibi_apps/ibi_help/Default.htm#securityAdmin/admin_console23.htm#Understa5

### レポート取得（get）

```javascript
// src/api/webfocus.js の getContents() 関数
GET /ibi_apps/rs?IBIRS_action=get&IBIRS_path=<path>

Response: XML形式で <rootObject><children><item> にフォルダ/ファイルを含む
```

### レポート定義取得（describeFex）

```javascript
// src/api/webfocus.js の describeFex() 関数
GET /ibi_apps/rs?IBIRS_action=describeFex&IBIRS_path=<path>

Response: XML形式で <amperMap><entry type="unresolved"> にパラメータ定義を含む
  - type="unresolved": ユーザー入力が必要なパラメータ
  - <values><entry>: 選択肢（ある場合）
```

### レポート実行（run）

```javascript
// src/api/webfocus.js の buildRunUrl() 関数
GET /ibi_apps/rs?IBIRS_action=run&IBIRS_path=<path>&<parameters>

Response: HTML, PDF, またはテキスト形式
```

### URL 生成ヘルパー

```javascript
// src/api/webfocus.js
buildRunUrl(path, parameterValues)       // run のURLを生成
buildDescribeFexUrl(path)                // describeFex のURLを生成
buildPropertiesUrl(path)                 // properties のURLを生成
buildGetContentUrl(path)                 // getContent のURLを生成
buildGetDetailsUrl(path, randomValue)    // getDetails のURLを生成
```

## 分業体制とベストプラクティス

このプロジェクトは、モダンWebアプリケーション開発の考え方に基づいて構成されています。

### なぜフロントエンド/バックエンド分離が重要か？

1. **AIによるコード生成支援**
   - 標準的なフレームワーク（Svelte、Vite） を使用することで、GitHub CopilotやChatGPTなどのAIツールが正確なコード提案を行える
   - WebFOCUS独自の構文に埋め込んだコードは AIが解析しにくい

2. **関心の分離（Separation of Concerns）**
   - UI ロジック（Svelte コンポーネント）とデータ取得ロジック（API呼び出し）が明確に分離
   - 修正時の影響範囲を特定でき、デバッグが容易

3. **再利用性**
   - WebFOCUS REST API クライアント（`src/api/webfocus.js`）は独立したモジュール
   - 他のフレームワーク、モバイルアプリなど、複数の場所から再利用可能

4. **テスト容易性**
   - UI表示の必要なく、API層のロジックをテスト可能
   - 自動テストスイートの構築が容易

### モジュール設計

```
API層 (src/api/webfocus.js)
  ↓ (REST API呼び出し)
WebFOCUS REST Service
  ↓
状態管理層 (src/stores/index.js)
  ↓
UI層 (src/components/*.svelte)
  ↓
ユーザー
```

各層が独立してテスト・開発可能な設計になっています。

## パラメータ抽出ロジックの詳細

`describeFex` API から パラメータを抽出する処理は `src/api/webfocus.js` の `describeFex()` 関数で行われます。

**抽出ロジック:**

1. `<amperMap><entry type="unresolved">` を検索
2. `<key value="...">` からパラメータ名を取得
3. `<values><entry>` から選択肢を抽出
   - 選択肢がある場合 → SELECT フィールド
   - 選択肢がない場合 → TEXT フィールド

**XML例:**

```xml
<amperMap>
  <entry type="unresolved">
    <key value="REGION"/>
    <values>
      <entry>
        <key value="APAC"/>
        <value value="APAC"/>
      </entry>
      <entry>
        <key value="EMEA"/>
        <value value="EMEA"/>
      </entry>
    </values>
  </entry>
  <entry type="resolved">
    <key value="START_DATE"/>
    <values/>
  </entry>
</amperMap>
```

## トラブルシューティング

### CORS エラーが発生する場合

`vite.config.js` のプロキシ設定を確認してください。

```javascript
server: {
  proxy: {
    '/ibi_apps': {
      target: 'http://localhost',  // WebFOCUSサーバーのURL
      changeOrigin: true,
      secure: false
    }
  }
}
```

### ログイン失敗

- ユーザー名とパスワードが正しいか確認
- WebFOCUSサーバーが動作中か確認
- ブラウザの開発者ツール (F12) → Network タブで API レスポンスを確認

### パラメータが表示されない

- `describeFex` API から正しく XML が返されているか確認
- `type="unresolved"` のエントリがあるか確認
- ブラウザコンソール (F12) でエラーを確認

## 参考資料

- [WebFOCUS REST API](https://dev.ibi.com/docs/wf93/en/webfocus_9.3.0/webfocus_rest_api/wf_rest_reference_introduction.htm)
- [Svelte ドキュメント](https://svelte.dev/docs)
- [Vite ドキュメント](https://vitejs.dev/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)

## ライセンス

This project is provided as a sample for WebFOCUS integration.

## 開発進歩

- ✅ ログイン機能
- ✅ レポート一覧表示
- ✅ フォルダナビゲーション
- ✅ 通常実行
- ✅ パラメータ付き実行（describeFex 利用）
- ✅ 実行結果表示（HTML/PDF/テキスト対応）
- 📋 今後の改善
  - ユーザー管理機能
  - レポートの保存・共有機能
  - スケジューリング機能
  - ダッシュボード表示
  - モバイルアプリ版

---

**作成日**: 2026年2月18日  
**ターゲット環境**: WebFOCUS 9.3.0 以上
