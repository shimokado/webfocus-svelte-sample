# WebFOCUS Svelte Sample - クイックスタートガイド

## ⚡ 5 分で始める

### 前提条件
- Node.js 16 以上
- WebFOCUS サーバーが `http://localhost:8080` で起動
- ユーザー認証情報（デフォルト: admin / admin）

### セットアップ

```bash
# 1. 依存スクを確認
npm list

# もし何か不足していれば
npm install

# 2. 開発サーバーを起動（ホットリロード有効）
npm run dev

# ブラウザで http://localhost:5173 を開く
```

### REST API サンプルページ

ログイン後に WebFOCUS REST API のテストページを開く手順:

1. ログイン

```
http://localhost/ibi_apps/rs?IBIRS_action=signOn&IBIRS_userName=admin&IBIRS_password=admin&IBIRS_service=ibfs
```

2. テストページを開く

```
http://localhost/ibi_apps/rs?IBIRS_action=TEST
```

### デプロイ後のアクセス

ビルド後に `c:\ibi\apps\svelte` へデプロイすると、以下の URL でアクセスできます。

```
http://localhost/approot/svelte/index.htm
```

このアクセス方法であれば WebFOCUS の CORS 制限がかからず、POST メソッドが必要な場合は必須です。

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

### 動作確認

1. **ログイン**: `admin` / `admin` でログイン
2. **レポート一覧**: フォルダ内のレポート（`.fex` ファイル）を表示
3. **フォルダ階層**: パンくずクリックで階層を移動
4. **レポート実行**:
   - 「実行」: 標準属性でレポート実行
   - 「詳細」: パラメータ入力フォームを生成して実行
5. **結果表示**: HTML/PDF/Text の形式で結果を表示

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

---

## 📂 プロジェクト構造

```
src/
├── api/
│   └── webfocus.js          ← REST API ラッパー（重要）
├── components/
│   ├── Header.svelte        ← ログイン UI
│   ├── ReportBrowser.svelte ← レポート一覧・フォルダ操作
│   ├── ReportCard.svelte    ← レポートカード
│   ├── ParameterModal.svelte ← パラメータ入力
│   └── ResultModal.svelte   ← 実行結果表示
├── stores/
│   └── index.js             ← 状態管理（Store）
├── app.css                  ← Tailwind スタイル
└── App.svelte               ← ルートコンポーネント
```

---

## 🔑 重要なファイル

### `src/api/webfocus.js` - REST API クライアント

全ての WebFOCUS REST API 呼び出しをここで管理します。

```javascript
// 主な関数
signOn(username, password)        // ログイン
getContents(path)                 // フォルダ内容取得
describeFex(path)                 // パラメータ定義取得
runReport(path)                   // レポート実行
runReportWithParams(path, params) // パラメータ付き実行
```

### `src/stores/index.js` - 状態管理

```javascript
// 主な Store
auth              // ログイン情報 + CSRF トークン
currentPath       // 現在のフォルダパス
contents          // フォルダ内容
executionResult   // 実行結果
```

### `vite.config.js` - 開発サーバー設定

```javascript
server: {
    proxy: {
        '/ibi_apps': {
            target: 'http://localhost',  // WebFOCUS サーバー位置
            changeOrigin: true
        }
    }
}
```

---

## 🛠️ よくある カスタマイズ

### 1. WebFOCUS サーバーのアドレスを変更

```javascript
// vite.config.js
proxy: {
    '/ibi_apps': {
        target: 'http://192.168.1.100:8080',  // ← ここを変更
        changeOrigin: true
    }
}
```

### 2. デフォルトフォルダを変更

```javascript
// src/stores/index.js
export const currentPath = writable('IBFS:/WFC/Repository/Reports');  // ← ここを変更
```

### 3. Tailwind CSS の色をカスタマイズ

```javascript
// tailwind.config.js
theme: {
    colors: {
        webfocus: {
            500: '#0066ff',  // ← メイン色
            600: '#0052cc',  // ← ホバー色
        }
    }
}
```

### 4. レポート実行時の追加パラメータ

```javascript
// src/api/webfocus.js の runReport 関数
const url = new URL(baseUrl);
url.searchParams.append('IBIRS_action', 'run');
url.searchParams.append('IBIRS_path', path);
url.searchParams.append('IBIRS_OUTPUT', 'HTML');  // ← 出力形式を指定
```

---

## 📖 ドキュメント構成

### 技術仕様書

| ファイル | 内容 |
|--------|------|
| README.md | プロジェクト全体について |
| PROJECT_SUMMARY.md | 実装概略 |
| QUICK_START.md | 5分で始める |
| docs/07_SYSTEM_DESIGN.md | 実装設計書 |

### `docs/` フォルダ（技術知識）

| ファイル | 対象読者 |
|--------|--------|
| 01_REST_API_GUIDE.md | REST API 初心者 |
| 02_IBFS_GUIDE.md | IBFS パス操作を学ぶ |
| 03_DESCRIBE_FEX_GUIDE.md | パラメータ抽出を実装 |
| 04_BEST_PRACTICES.md | セキュリティ・設計 |
| 05_SVELTE_PATTERNS.md | Svelte での実装 |
| 06_TROUBLESHOOTING.md | エラー解決 |
| README.md | ドキュメント索引 |

---

## 🧪 実装例

### 例1: ユーザーログイン

```javascript
// Header.svelte
import { signOn } from '../api/webfocus.js';
import { auth } from '../stores/index.js';

async function handleLogin(e) {
    e.preventDefault();
    const result = await signOn(username, password);
    
    if (result.success) {
        auth.set({
            isLoggedIn: true,
            user: result.data.user,
            tokens: result.data.tokens
        });
    } else {
        errorMessage = result.error;  // ユーザーに表示
    }
}
```

### 例2: フォルダ内容を取得して表示

```javascript
// ReportBrowser.svelte
import { getContents } from '../api/webfocus.js';
import { currentPath, contents } from '../stores/index.js';

async function loadFolder() {
    contents.update(c => ({ ...c, loading: true }));
    
    const result = await getContents($currentPath);
    
    if (result.success) {
        contents.set({
            items: result.data.items,
            loading: false,
            error: null
        });
    } else {
        contents.set({
            items: [],
            loading: false,
            error: result.error
        });
    }
}

// HTML テンプレート
{#if $contents.loading}
    <div>読み込み中...</div>
{:else if $contents.error}
    <div class="text-red-600">{$contents.error}</div>
{:else}
    {#each $contents.items as item (item.fullPath)}
        <div class="card">
            <h3>{item.name}</h3>
            <p>{item.description}</p>
        </div>
    {/each}
{/if}
```

### 例3: パラメータ付きレポート実行

```javascript
// ParameterModal.svelte
import { describeFex, runReportWithParams } from '../api/webfocus.js';

// 1. パラメータ定義を取得
const paramResult = await describeFex(reportPath);

// 2. フォーム生成（describeFex の結果から）
paramResult.data.parameters.forEach(param => {
    if (param.options) {
        // SELECT フィールド生成
        renderSelect(param);
    } else {
        // TEXT フィールド生成
        renderTextInput(param);
    }
});

// 3. フォーム送信時にレポート実行
async function handleSubmit() {
    const params = {
        PARM1: document.getElementById('parm1').value,
        PARM2: document.getElementById('parm2').value
    };
    
    const result = await runReportWithParams(reportPath, params);
    
    if (result.success) {
        displayResult(result.data);
    } else {
        showError(result.error);
    }
}
```

---

## 🚀 拡張ポイント

### よく追加される機能

#### 1. ユーザー管理
```
docs/02_IBFS_GUIDE.md の例参照
→ getContents('IBFS:/SSYS/USERS') でユーザー一覧取得
```

#### 2. レポート検索
```javascript
// src/stores/index.js に searchFilter Store を追加
export const searchFilter = writable('');

// ReportBrowser.svelte で フィルタリング
const filtered = $contents.items.filter(item => 
    item.name.includes($searchFilter)
);
```

#### 3. 実行履歴
```javascript
// src/stores/index.js に executionHistory Store を追加
export const executionHistory = writable([]);

// レポート実行後に履歴を記録
executionHistory.update(h => [
    { timestamp: new Date(), path, params },
    ...h
].slice(0, 20));  // 最新20件
```

#### 4. ダークモード
```javascript
// tailwind.config.js
darkMode: 'class',

// HTML class="dark" で有効化
```

---

## ⚙️ 環境設定

### 開発環境

```bash
# 開発サーバー起動（ホットリロード有効）
npm run dev

# ブラウザで開く
http://localhost:5173

# ビルドして確認
npm run build
npm preview
```

### 本番環境

```bash
# ビルド
npm run build

# 出力は dist/ フォルダ
# これを Webサーバーに配置

# または直接デプロイ
npm run deploy
# → c:\ibi\apps\svelte に xcopy で копирует
```

---

## 🔍 デバッグ

### ブラウザ DevTools

1. **Network タブ**
   - `/ibi_apps/rs` リクエストをクリック
   - Response タブで XML を確認

2. **Console タブ**
   ```javascript
   // API レスポンスをテスト
   fetch('/ibi_apps/rs?...')
       .then(r => r.text())
       .then(console.log);
   ```

3. **Svelte DevTools** (拡張機能)
   - Store の内容をリアルタイム確認
   - コンポーネント階層を確認

### ログ出力

```javascript
// src/api/webfocus.js に追加
console.log('API 呼び出し:', { url, params });
console.log('XML レスポンス:', xmlDoc.documentElement.outerHTML);
console.log('解析結果:', result);
```

---

## 📚 参考資料

### 公式ドキュメント
- [Svelte](https://svelte.dev/docs)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MDN - Fetch API](https://developer.mozilla.org/ja/docs/Web/API/Fetch_API)
- [MDN - DOMParser](https://developer.mozilla.org/ja/docs/Web/API/DOMParser)

### プロジェクト内ドキュメント
```
README.md                          ← プロジェクト説明
docs/01_REST_API_GUIDE.md          ← REST API 基礎
docs/02_IBFS_GUIDE.md              ← IBFS パス操作
docs/03_DESCRIBE_FEX_GUIDE.md      ← パラメータ抽出
docs/04_BEST_PRACTICES.md          ← ベストプラクティス
docs/05_SVELTE_PATTERNS.md         ← Svelte パターン
docs/06_TROUBLESHOOTING.md         ← トラブル解決
```

---

## 💡 ヒント

### REST API を直接テスト

```bash
# PowerShell で
$body = @{
    IBIRS_service = 'ibfs'
    IBIRS_action = 'signOn'
    IBIRS_user = 'admin'
    IBIRS_pass = 'admin'
}

$response = Invoke-WebRequest -Uri 'http://localhost/ibi_apps/rs' `
    -Method POST `
    -Body $body `
    -ContentType 'application/x-www-form-urlencoded'

# XML を確認
$response.Content
```

### Svelte ファイルの構文チェック

```bash
# Svelte LSP をインストール
npm install -D svelte-language-server

# VS Code で Svelte Extension を有効化
# ID: svelte.svelte-vscode
```

---

## 🐛 よくあるエラー

### "ログインに失敗しました"
→ [docs/06_TROUBLESHOOTING.md](docs/06_TROUBLESHOOTING.md#ログイン-1) を参照

### "XMLパースエラー"
→ WebFOCUS が起動しているか確認
→ Network タブで HTML が返されていないか確認

### "CORS エラー"
→ `vite.config.js` のプロキシ設定を確認
→ API 呼び出しで相対パスを使用しているか確認

### "セッションエラー"
→ `fetch()` に `credentials: 'include'` があるか確認
→ CSRF トークンが Store に保存されているか確認

---

## 📞 サポート

エラーや問題が発生した場合:

1. [docs/06_TROUBLESHOOTING.md](docs/06_TROUBLESHOOTING.md) で検索
2. ブラウザ DevTools で Network/Console をチェック
3. 関連ドキュメント（01-05）で実装パターンを確認
4. [参考実装](C:\ibi\apps\rest\index.js) のコード を参照

---

**最終更新**: 2026年2月18日  
**バージョン**: 1.0  
**プロジェクト**: WebFOCUS Svelte Sample
