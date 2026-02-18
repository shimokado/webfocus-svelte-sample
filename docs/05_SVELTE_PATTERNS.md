# Svelte での WebFOCUS REST API 実装パターン

Vanilla JS 参考実装（`C:\ibi\apps\rest\index.js`）の設計をSvelte で適応させるための実装ガイドです。

## 目次

1. [API モジュール設計](#api-モジュール設計)
2. [コンポーネント構成](#コンポーネント構成)
3. [状態管理](#状態管理)
4. [リアクティビティ](#リアクティビティ)
5. [エラーハンドリング](#エラーハンドリング)
6. [テスト戦略](#テスト戦略)
7. [参考実装との対応](#参考実装との対応)

---

## API モジュール設計

### 原則

Vanilla JS の参考実装では、HTML 生成と API 呼び出しが混在していました。Svelte では、これを分離します。

```
参考実装（Vanilla JS）:
  fetch → XML 解析 → HTML 生成 → DOM 操作
  
Svelte での分離:
  API モジュール（fetch + XML 解析）
       ↓
  Store（状態管理）
       ↓
  コンポーネント（リアクティブ表示）
```

### API モジュール実装例

参考実装の `displayError()` と同じ情報を返す設計：

本プロジェクトでは `IBIRS_action` ごとの GET/POST を JSON で管理します。

```javascript
const ACTION_METHODS = {
    signOn: 'GET',
    signOff: 'GET',
    get: 'GET',
    describeFex: 'GET',
    run: 'GET'
};
```

```javascript
// src/api/webfocus.js

/**
 * WebFOCUS REST API クライアント
 * 責務: HTTP リクエスト + XML 解析のみ
 * 返値: {success, data/error, statusCode} の統一形式
 */

export async function signOn(username, password) {
    try {
        const params = new URLSearchParams();
        params.append('IBIRS_service', 'ibfs');
        params.append('IBIRS_action', 'signOn');
        params.append('IBIRS_userName', username);
        params.append('IBIRS_password', password);

        const url = `http://localhost/ibi_apps/rs?${params.toString()}`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        const xmlText = await response.text();
        
        // XML パースエラー検出（重要）
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
        if (xmlDoc.querySelector('parsererror')) {
            return {
                success: false,
                statusCode: 'PARSE_ERROR',
                error: 'XMLパースエラー',
                debug: xmlText.substring(0, 200)
            };
        }

        // API エラー検出
        const ibfsrpc = xmlDoc.querySelector('ibfsrpc');
        if (!ibfsrpc) {
            return {
                success: false,
                statusCode: 'INVALID_RESPONSE',
                error: 'レスポンス形式エラー'
            };
        }

        const returncode = ibfsrpc.getAttribute('returncode');
        const returndesc = ibfsrpc.getAttribute('returndesc');

        if (returncode !== '10000') {
            return {
                success: false,
                statusCode: returncode,
                error: returndesc,
                debug: { returncode, ibfsrpc: ibfsrpc.outerHTML }
            };
        }

        // CSRF トークン抽出
        const tokens = extractCSRFTokens(xmlDoc);
        
        return {
            success: true,
            data: {
                user: username,
                tokens: tokens
            }
        };
    } catch (error) {
        return {
            success: false,
            statusCode: 'NETWORK_ERROR',
            error: error.message
        };
    }
}

/**
 * CSRF トークン抽出（Vanilla JS の parseProperties と同じロジック）
 */
function extractCSRFTokens(xmlDoc) {
    const tokens = {};
    const entries = xmlDoc.querySelectorAll('properties > entry');
    
    let tokenName = null;
    let tokenValue = null;

    entries.forEach((entry) => {
        const key = entry.getAttribute('key');
        const value = entry.getAttribute('value') || entry.textContent;

        if (key === 'IBI_CSRF_Token_Name') {
            tokenName = value;
        }
        if (key === 'IBI_CSRF_Token_Value') {
            tokenValue = value;
        }
    });

    if (tokenName && tokenValue) {
        tokens[tokenName] = tokenValue;
    }

    return tokens;
}

/**
 * フォルダ内容取得
 */
export async function getContents(path) {
    try {
        const params = new URLSearchParams();
        params.append('IBIRS_service', 'ibfs');
        params.append('IBIRS_action', 'get');
        params.append('IBIRS_path', path);

        const response = await fetch(`http://localhost/ibi_apps/rs?${params.toString()}`, {
            credentials: 'include'
        });

        const xmlText = await response.text();
        const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');

        if (xmlDoc.querySelector('parsererror')) {
            return {
                success: false,
                statusCode: 'PARSE_ERROR',
                error: 'XMLパースエラー'
            };
        }

        const ibfsrpc = xmlDoc.querySelector('ibfsrpc');
        const returncode = ibfsrpc?.getAttribute('returncode');
        const returndesc = ibfsrpc?.getAttribute('returndesc');

        if (returncode !== '10000') {
            return {
                success: false,
                statusCode: returncode,
                error: returndesc
            };
        }

        const items = parseItemList(xmlDoc);

        return {
            success: true,
            data: {
                path: path,
                items: sortItems(items)  // フォルダを先に表示
            }
        };
    } catch (error) {
        return {
            success: false,
            statusCode: 'NETWORK_ERROR',
            error: error.message
        };
    }
}

/**
 * アイテム一覧解析（参考実装の parseReportList と同じロジック）
 */
function parseItemList(xmlDoc) {
    const items = [];
    const itemElements = xmlDoc.querySelectorAll('rootObject > children > item');

    itemElements.forEach((item) => {
        items.push({
            name: item.getAttribute('name') || '',
            type: item.getAttribute('objtype') || 'unknown',
            fullPath: item.getAttribute('fullPath') || '',
            description: item.getAttribute('description') || 
                        item.getAttribute('rawDescription') || '',
            lastModified: formatTimestamp(item.getAttribute('lastModified')),
            typeDescription: item.getAttribute('typeDescription') || ''
        });
    });

    return items;
}

/**
 * アイテムをソート（フォルダを先、ソートなし）
 */
function sortItems(items) {
    return items.sort((a, b) => {
        const aIsFolder = a.type === 'Folder';
        const bIsFolder = b.type === 'Folder';
        
        // フォルダ → ファイル
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        
        return 0;  // 同じ型の場合は元の順序を保持
    });
}

/**
 * タイムスタンプをローカル表示形式に変換
 * 参考実装: new Date(timestamp).toLocaleString('ja-JP')
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    return new Date(parseInt(timestamp)).toLocaleString('ja-JP');
}
```

---

## コンポーネント構成

### 参考実装との対応

| 参考実装（Vanilla JS） | Svelte コンポーネント | 責務 |
|---------------------|---------------------|------|
| ログインフォーム | Header.svelte | ユーザー認証 UI |
| ユーザー一覧表示 | UserBrowser.svelte | ユーザー一覧表示 |
| レポート一覧表示 | ReportBrowser.svelte | レポート一覧・フォルダ操作 |
| レポート詳細実行 | ParameterModal.svelte | パラメータ入力 |
| 実行結果表示 | ResultModal.svelte | 実行結果表示 |

### Header コンポーネント

参考実装の `handleLoginFormSubmit()` をコンポーネント化：

```svelte
<!-- src/components/Header.svelte -->
<script>
    import { auth } from '../stores/index.js';
    import { signOn } from '../api/webfocus.js';

    let username = '';
    let password = '';
    let errorMessage = '';
    let isLoading = false;

    async function handleSubmit(e) {
        e.preventDefault();
        isLoading = true;
        errorMessage = '';

        // 参考実装と同じ API 呼び出し
        const result = await signOn(username, password);

        if (result.success) {
            // Store を更新（Vanilla JS の グローバル変数 の代わり）
            auth.set({
                isLoggedIn: true,
                user: result.data.user,
                tokens: result.data.tokens,
                error: null
            });
            
            // フォーム初期化
            username = '';
            password = '';
            errorMessage = '';
        } else {
            // 参考実装の displayError() と同じ方法でエラーを表示
            errorMessage = result.error;
            console.error('ログインエラー:', result);
        }

        isLoading = false;
    }

    function handleLogout() {
        auth.set({
            isLoggedIn: false,
            user: null,
            tokens: null,
            error: null
        });
        username = '';
        password = '';
    }
</script>

<header>
    {#if !$auth.isLoggedIn}
        <form on:submit={handleSubmit}>
            <input 
                type="text" 
                placeholder="ユーザー名" 
                bind:value={username}
                disabled={isLoading}
            />
            <input 
                type="password" 
                placeholder="パスワード" 
                bind:value={password}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
            {#if errorMessage}
                <div class="error-message">{errorMessage}</div>
            {/if}
        </form>
    {:else}
        <div class="user-info">
            <span>ログイン中: {$auth.user}</span>
            <button on:click={handleLogout}>ログアウト</button>
        </div>
    {/if}
</header>

<style>
    header {
        padding: 1rem;
        background-color: #f0f0f0;
        border-bottom: 1px solid #ddd;
    }

    form {
        display: flex;
        gap: 0.5rem;
    }

    input {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    button {
        padding: 0.5rem 1rem;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .error-message {
        color: red;
        margin-top: 0.5rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
</style>
```

---

## 状態管理

### Store 設計

参考実装のグローバル変数の代わりに、Svelte Stores を使用します：

```javascript
// src/stores/index.js

import { writable } from 'svelte/store';

/**
 * 認証状態（参考実装の g_userLoginInfo に相当）
 */
export const auth = writable({
    isLoggedIn: false,
    user: null,
    tokens: null,
    error: null
});

/**
 * 現在のパス（参考実装の currentPath に相当）
 */
export const currentPath = writable('IBFS:/WFC/Repository');

/**
 * パスの履歴（参考実装の pathHistory に相当）
 */
export const pathHistory = writable([]);

/**
 * フォルダ内容（参考実装の renderReportList のデータに相当）
 */
export const contents = writable({
    items: [],
    loading: false,
    error: null,
    path: null
});

/**
 * 実行結果（参考実装の結果表示に相当）
 */
export const executionResult = writable({
    open: false,
    result: null,
    contentType: null,
    error: null
});
```

### Store 更新パターン

```javascript
// 非同期操作中のローディング表示
contents.set({
    items: [],
    loading: true,
    error: null
});

// 成功時
const result = await getContents(path);
if (result.success) {
    contents.set({
        items: result.data.items,
        loading: false,
        error: null,
        path: result.data.path
    });
} else {
    // エラー時（参考実装の displayError と同じこと）
    contents.set({
        items: [],
        loading: false,
        error: result.error,
        path: null
    });
}
```

---

## リアクティビティ

### 自動再評価（Reactive Declarations）

参考実装では手動で `renderReportList()` を呼び出していましたが、Svelte では自動的に更新されます：

```svelte
<script>
    import { contents } from '../stores/index.js';

    // Store の変更を自動検知して再レンダリング
    // （参考実装の手動call不要）
</script>

{#if $contents.loading}
    <div>読み込み中...</div>
{:else if $contents.error}
    <div class="error">{$contents.error}</div>
{:else}
    <div class="report-list">
        {#each $contents.items as item (item.fullPath)}
            <div class="report-card">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
            </div>
        {/each}
    </div>
{/if}
```

### Computed Values

複数の Store の値を組み合わせたい場合：

```javascript
// src/stores/derived.js
import { derived } from 'svelte/store';
import { currentPath, contents } from './index.js';

/**
 * 現在のパスの親パスを自動計算
 */
export const parentPath = derived(
    currentPath,
    $currentPath => {
        const parts = $currentPath.split('/');
        if (parts.length <= 2) return null;
        parts.pop();
        return parts.join('/');
    }
);

/**
 * フォルダのみをフィルタ
 */
export const folders = derived(
    contents,
    $contents => $contents.items.filter(item => item.type === 'Folder')
);

/**
 * FEX ファイルのみをフィルタ
 */
export const fexFiles = derived(
    contents,
    $contents => $contents.items.filter(item => item.type === 'FexFile')
);
```

---

## エラーハンドリング

### Svelte でのエラー表示パターン

参考実装の `displayError()` をコンポーネント化：

```svelte
<!-- src/components/ErrorAlert.svelte -->
<script>
    export let error = null;
    export let returncode = null;
    export let debug = false;

    function closeError() {
        error = null;
    }
</script>

{#if error}
    <div class="alert alert-error">
        <div class="alert-content">
            <div class="alert-title">❌ エラーが発生しました</div>
            {#if returncode}
                <p><strong>コード:</strong> {returncode}</p>
            {/if}
            <p><strong>メッセージ:</strong> {error}</p>
            {#if debug}
                <details>
                    <summary>詳細情報</summary>
                    <pre>{JSON.stringify(debug, null, 2)}</pre>
                </details>
            {/if}
        </div>
        <button class="close-btn" on:click={closeError}>✕</button>
    </div>
{/if}

<style>
    .alert {
        padding: 1rem;
        margin: 1rem 0;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        background-color: #f8d7da;
        color: #721c24;
    }

    .alert-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .alert-title {
        font-weight: bold;
    }

    .close-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
    }

    pre {
        background-color: #fff3cd;
        padding: 0.5rem;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.8rem;
    }
</style>
```

### コンポーネントでの使用

```svelte
<script>
    import ErrorAlert from './ErrorAlert.svelte';
    import { contents } from '../stores/index.js';
</script>

<ErrorAlert 
    error={$contents.error}
    debug={true}
/>

<div class="content">
    {#if $contents.loading}
        <div>読み込み中...</div>
    {:else if $contents.error}
        <!-- ErrorAlert で既に表示されているため、ここは不要 -->
    {:else}
        <!-- コンテンツ表示 -->
    {/if}
</div>
```

---

## テスト戦略

### API モジュールのテスト

```javascript
// tests/api/webfocus.test.js

import { signOn, getContents } from '../../src/api/webfocus.js';

describe('WebFOCUS API', () => {
    // モック Fetch
    global.fetch = jest.fn();
    global.DOMParser = require('jsdom').JSDOM.prototype.DOMParser;

    test('signOn success', async () => {
        const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
            <ibfsrpc returncode="10000" returndesc="ok">
                <properties>
                    <entry key="IBI_CSRF_Token_Name" value="XSRF-TOKEN"/>
                    <entry key="IBI_CSRF_Token_Value" value="abc123"/>
                </properties>
            </ibfsrpc>`;

        fetch.mockResolvedValueOnce({
            text: () => Promise.resolve(mockXml)
        });

        const result = await signOn('user', 'pass');
        
        expect(result.success).toBe(true);
        expect(result.data.user).toBe('user');
        expect(result.data.tokens['XSRF-TOKEN']).toBe('abc123');
    });

    test('signOn error handling', async () => {
        const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
            <ibfsrpc returncode="99" returndesc="Invalid credentials"/>`;

        fetch.mockResolvedValueOnce({
            text: () => Promise.resolve(mockXml)
        });

        const result = await signOn('user', 'wrong');
        
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe('99');
        expect(result.error).toBe('Invalid credentials');
    });

    test('network error handling', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await signOn('user', 'pass');
        
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe('NETWORK_ERROR');
    });
});
```

### コンポーネントのテスト

```svelte
<!-- tests/Header.test.svelte -->
<script context="module">
    import { render } from '@testing-library/svelte';
    import Header from '../../src/components/Header.svelte';

    test('login form displays error message', async () => {
        const { getByText, getByPlaceholderText } = render(Header);
        
        const usernameInput = getByPlaceholderText('ユーザー名');
        const loginButton = getByText('ログイン');

        // API エラーをモック
        global.fetch = jest.fn(() => 
            Promise.resolve({
                text: () => Promise.resolve(`
                    <ibfsrpc returncode="99" returndesc="Invalid credentials"/>
                `)
            })
        );

        // フォーム送信
        await userEvent.type(usernameInput, 'user');
        await userEvent.type(getByPlaceholderText('パスワード'), 'wrong');
        await userEvent.click(loginButton);

        // エラー表示を確認
        expect(getByText('Invalid credentials')).toBeInTheDocument();
    });
</script>
```

---

## 参考実装との対応

### 機能マッピング表

| 参考実装（Vanilla JS） | Svelte 対応 |
|---------------------|-----------|
| グローバル変数（状態） | Store（writable/derived） |
| `handleXxxFormSubmit()` | コンポーネントの `on:submit` + async 関数 |
| `displayXxx()` | Svelte リアクティブな条件分岐（`{#if}`） |
| `renderXxx()` | Svelte テンプレート（`{#each}`） |
| `parseXxx()` → API 結果 | API モジュール が返却 |
| イベントリスナー | `on:` ディレクティブ |
| DOM 操作 | 不要（Svelte が自動） |

---

## ベストプラクティス

### DO ✅

- API モジュール は HTTP と XML 解析のみ担当
- コンポーネント は UI 表示とイベント処理のみ
- Store は中央集中管理
- エラーは一貫した形式で返却（`{success, data/error, statusCode}`）
- ローディング中のユーザーフィードバック を常に提供
- 標準化されたエラーメッセージ を使用

### DON'T ❌

- コンポーネント 内で直接 fetch する
- HTML 文字列にユーザー入力を無エスケープで挿入する
- グローバル変数 を使用する
- エラーメッセージ をユーザーに隠す
- ローディング中に複数リクエスト を送信する

---

**参考実装**: C:\ibi\apps\rest\index.js (676行)  
**対応する Svelte**: `src/api/webfocus.js`, `src/components/*`, `src/stores/index.js`
