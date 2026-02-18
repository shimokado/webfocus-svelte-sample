# WebFOCUS Svelte アプリケーション - トラブルシューティング

開発および本番運用時に遭遇しやすい問題と解決方法をまとめました。

## 目次

1. [ビルド・実行時エラー](#ビルド実行時エラー)
2. [ログイン関連](#ログイン関連)
3. [API 通信エラー](#api-通信エラー)
4. [XML 解析エラー](#xml-解析エラー)
5. [セッション・認証](#セッション認証)
6. [UI 表示問題](#ui-表示問題)
7. [デバッグテクニック](#デバッグテクニック)

---

## ビルド・実行時エラー

### エラー: `npm run dev` で Vite が起動しない

```
Error: listen EADDRINUSE :::5173
```

**原因**: ポート 5173 が既に使用中

**解決方法**:
1. 既存プロセスを終了
   ```powershell
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. または別のポート を指定
   ```javascript
   // vite.config.js
   export default {
     server: {
       port: 5174
     }
   }
   ```

---

### エラー: `npm run build` が失敗

```
error: could not compile Svelte component
```

**原因**: Svelte コンポーネントに構文エラー

**解決方法**:
```bash
# 詳細ログを確認
npm run build -- --debug

# または vite.config.js で詳細出力
export default {
  logLevel: 'debug'
}
```

確認項目:
- `{#if}` `{#each}` ブロックの閉じ括弧 `{/if}` `{/each}` が存在するか
- `let` 変数の宣言が `<script>` ブロック内か
- バインディング記法 `bind:value` の綴りは正しいか

---

### エラー: `npm install` で依存関係の競合

```
npm ERR! peer dep missing: peerDependencies issue
```

**解決方法**:
```bash
# package-lock.json を削除して再生成
rm package-lock.json
npm install

# または --force で強制
npm install --force
```

---

## ログイン関連

### 問題：「ユーザー名またはパスワードが間違っています」と表示されるが、本来は正しい認証情報

**原因**: 複数の可能性

1. **Cookies が送信されていない**
   ```javascript
   // ❌ 間違い（credentials がない）
   fetch('http://localhost/ibi_apps/rs', {
       method: 'POST',
       body: params
   });

   // ✅ 正解
   fetch('http://localhost/ibi_apps/rs', {
       method: 'POST',
       body: params,
       credentials: 'include'  // ← 必須
   });
   ```

2. **WebFOCUS サーバーが起動していない**
   ```bash
   # WebFOCUS サーバーの起動確認
   http://localhost/ibi_apps/rs
   
   # ブラウザで訪問して 500 エラーが出ない か確認
   ```

3. **プロキシ設定が間違っている**
   ```javascript
   // vite.config.js を確認
   proxy: {
       '/ibi_apps': {
           target: 'http://localhost',  // ← WebFOCUS サーバーのURL確認
           changeOrigin: true
       }
   }
   ```

**デバッグ方法**:
```javascript
// Header.svelte の handleSubmit で追加ログ
console.log('ユーザー名:', username);
console.log('API レスポンス:', result);
console.log('XML:', result.debug);  // XML 生のレスポンス確認
```

---

### 問題：ログイン後すぐに「セッションが失敗しました」

**原因**: CSRF トークンが正しく抽出されていない

**解決方法**:

1. CSRF トークンを確認
   ```javascript
   // src/api/webfocus.js の extractCSRFTokens を修正
   function extractCSRFTokens(xmlDoc) {
       console.log('XML before parsing:', xmlDoc.documentElement.outerHTML);
       
       const tokens = {};
       const entries = xmlDoc.querySelectorAll('properties > entry');
       
       console.log('Found entries:', entries.length);  // ← いくつ見つかったか確認
       
       entries.forEach((entry) => {
           const key = entry.getAttribute('key');
           const value = entry.getAttribute('value') || entry.textContent;
           
           console.log(`Entry: ${key} = ${value}`);  // ← 各エントリを確認
           
           if (key === 'IBI_CSRF_Token_Name') {
               tokens.tokenName = value;
           }
           if (key === 'IBI_CSRF_Token_Value') {
               tokens.tokenValue = value;
           }
       });
       
       console.log('Extracted tokens:', tokens);
       return tokens;
   }
   ```

2. ログイン後の auth Store 状態を確認
   ```javascript
   // Header.svelte
   import { auth } from '../stores';
   
   $: console.log('Auth store:', $auth);  // ← リアクティブに表示
   ```

---

## API 通信エラー

### エラー: "XMLパースエラー"

```
状態: PARSE_ERROR
エラー: XMLパースエラー
```

**原因**: WebFOCUS が HTML エラーページを返している

**解決方法**:

1. Network タブでレスポンスを確認
   ```
   ブラウザ DevTools → Network タブ
   → /ibi_apps/rs リクエストをクリック
   → Response タブで HTML が返されていないか確認
   ```

2. XML 生のレスポンスをログ出力
   ```javascript
   // src/api/webfocus.js
   const xmlText = await response.text();
   console.log('Raw response:', xmlText);  // ← 最初の100文字を見る
   
   if (xmlText.startsWith('<html>')) {
       console.error('HTML エラーページが返されました');
       console.error(xmlText);  // ← HTML 全体をコンソールに出力
   }
   ```

3. よくある HTML エラーページ
   - `500 Internal Server Error`: WebFOCUS プリプロセッサ障害
   - `404 Not Found`: `/ibi_apps/rs` エンドポイントが存在しない
   - `IIS エラーページ`: IIS 認証設定に問題

---

### エラー: "CORS エラーが発生しました"

```
Access to XMLHttpRequest at 'http://localhost/ibi_apps/rs' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**原因**: ブラウザの CORS ポリシー

**解決方法**:

1. **開発環境での対処** (Vite プロキシ)
   ```javascript
   // vite.config.js
   export default {
     server: {
       proxy: {
         '/ibi_apps': {
           target: 'http://localhost',  // WebFOCUS サーバー
           changeOrigin: true,
           rewrite: (path) => path  // パスはそのまま
         }
       }
     }
   }
   ```

   API 呼び出しを修正:
   ```javascript
   // ❌ 昔の方法（localhost 直指定）
   fetch('http://localhost/ibi_apps/rs')

   // ✅ 新しい方法（相対パス）
   fetch('/ibi_apps/rs')
   ```

2. **本番環境での対処**
   - WebFOCUS IIS に CORS ヘッダを設定
    - または同一オリジン内でホストする
    - `c:\ibi\apps\svelte` にデプロイして http://localhost/approot/svelte/index.htm でアクセス

### WebFOCUS セキュリティ設定の確認ポイント

管理コンソールの Security タブで確認できる主な注意点:

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

---

### エラー: タイムアウト（リクエストが返ってこない）

**原因**: WebFOCUS サーバーの過負荷またはハング

**解決方法**:

1. タイムアウトを設定
   ```javascript
   // src/api/webfocus.js
   export async function fetchWithTimeout(url, options, timeout = 10000) {
       const controller = new AbortController();
       const timeoutId = setTimeout(() => controller.abort(), timeout);
       
       try {
           const response = await fetch(url, {
               ...options,
               signal: controller.signal
           });
           clearTimeout(timeoutId);
           return response;
       } catch (error) {
           if (error.name === 'AbortError') {
               return {
                   success: false,
                   statusCode: 'TIMEOUT',
                   error: `リクエストがタイムアウトしました（${timeout}ms）`
               };
           }
           throw error;
       }
   }
   ```

2. WebFOCUS サーバーのプロセスを確認
   ```bash
   tasklist | findstr java  # WebFOCUS プロセス確認
   ```

---

## XML 解析エラー

### 問題：`getAttribute('name')` が `null` を返す

**原因**: 属性が存在しない、または要素構造が異なる

**解決方法**:

1. 属性存在確認
   ```javascript
   const name = item.getAttribute('name');
   console.log('属性 name 存在:', name !== null);  // ← true か false か
   console.log('全属性:', item.attributes);  // ← どんな属性があるか
   ```

2. デフォルト値を提供
   ```javascript
   // ❌ 悪い
   const name = item.getAttribute('name');  // null の可能性

   // ✅ 良い（常に文字列）
   const name = item.getAttribute('name') || 'Unknown';
   ```

3. 要素構造を確認
   ```javascript
   console.log('HTML:', item.outerHTML);  // ← 要素全体を確認
   ```

---

### 問題：`querySelector` が見つからない

```javascript
const element = xmlDoc.querySelector('rootObject > children > item');
// null が返される
```

**原因**: セレクタが要素構造と合致していない

**解決方法**:

1. XML 構造全体をコンソールに出力
   ```javascript
   const xmlText = await response.text();
   console.log(xmlText);  // ← 全体を見て構造確認
   ```

2. セレクタを段階的にテスト
   ```javascript
   const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
   
   console.log('rootObject 存在:', xmlDoc.querySelector('rootObject') ? 'yes' : 'no');
   console.log('children 存在:', xmlDoc.querySelector('children') ? 'yes' : 'no');
   console.log('item 存在:', xmlDoc.querySelector('item') ? 'yes' : 'no');
   
   // または 別のセレクタを試す
   console.log('descendants:', xmlDoc.querySelectorAll('*'));  // ← 全要素
   ```

---

## セッション・認証

### 問題：レポート実行時に「認証が必要です」

**原因**: セッションが切れている、または CSRF トークンが無効

**解決方法**:

1. 再ログインさせる
   ```javascript
   // src/api/webfocus.js の runReport で
   const result = await runReport(path);
   
   if (result.statusCode === 'UNAUTHORIZED' || result.statusCode === '99') {
       // セッションが切れたと判定
       auth.set({ isLoggedIn: false });
       
       // ユーザーにログインを促す
       alert('セッションが切れました。もう一度ログインしてください');
   }
   ```

2. CSRF トークン が Store に保存されているか確認
   ```javascript
   import { auth } from '../stores';
   
   auth.subscribe(value => {
       console.log('CSRF tokens:', value.tokens);
   });
   ```

### 問題：signOn 後に get が認証失敗になる

**原因**: セッション cookie が Secure 属性付きで HTTP 送信されない

**解決方法**:

- approot 配下（同一 Origin）でアプリを配信してセッションを維持
- HTTPS を有効化するか、サーバー側の cookie 設定を確認

---

### 問題：複数タブで同時にログイン・ログアウト

**原因**: 各タブのセッション状態が同期されていない

**解決方法**:

タブ間で状態を同期:
```javascript
// src/stores/index.js

// localStorage を使用して複数タブを同期
const createAuthStore = () => {
    const stored = localStorage.getItem('auth');
    const initial = stored ? JSON.parse(stored) : {
        isLoggedIn: false,
        user: null,
        tokens: null
    };
    
    const { subscribe, set, update } = writable(initial);
    
    return {
        subscribe,
        login(user, tokens) {
            const value = { isLoggedIn: true, user, tokens };
            localStorage.setItem('auth', JSON.stringify(value));
            set(value);
        },
        logout() {
            const value = { isLoggedIn: false, user: null, tokens: null };
            localStorage.removeItem('auth');
            set(value);
        }
    };
};

export const auth = createAuthStore();

// 別タブでの変更を検知
window.addEventListener('storage', (e) => {
    if (e.key === 'auth') {
        auth.set(JSON.parse(e.newValue));
    }
});
```

---

## UI 表示問題
### 問題：ログイン後にカードが表示されない

**原因**: `get` の XML が `rootObject > children > item` を返し、解析対象が合っていない

**解決方法**:

- `ibfsobject` がない場合は `rootObject` を解析する
- `type` が `MRFolder` / `FexFile` のため、型判定を正規化する

### 問題：ボタンが反応しない

**原因**: `on:click` ハンドラが async なのに await されていない

**解決方法**:

```svelte
<!-- ❌ 悪い例 -->
<button on:click={async () => {
    const result = await getContents(path);
    // ハンドラが完了を待たない
}}>
    クリック
</button>

<!-- ✅ 良い例 -->
<script>
    let isLoading = false;
    
    async function handleClick() {
        isLoading = true;
        const result = await getContents(path);
        isLoading = false;
    }
</script>

<button on:click={handleClick} disabled={isLoading}>
    {isLoading ? 'ローディング...' : 'クリック'}
</button>
```

---

### 問題：状態が更新されても UI が再レンダリングされない

**原因**: Svelte の リアクティビティ が機能していない

**解決方法**:

```svelte
<!-- ❌ 悪い例（オブジェクト変更はリアクティブでない） -->
<script>
    let items = { list: [] };
    items.list.push('新規');  // ← 反応しない
</script>

<!-- ✅ 良い例（オブジェクト再割り当て） -->
<script>
    let items = { list: [] };
    items.list = [...items.list, '新規'];  // または
    items = { ...items, list: [...items.list, '新規'] };
</script>

<!-- または Store を使用 -->
<script>
    import { contents } from '../stores';
    contents.update(c => ({
        ...c,
        items: [...c.items, newItem]
    }));
</script>
```

---

### 問題：レスポンシブなレイアウトが崩れる

**原因**: Tailwind CSS のブレークポイント指定が間違っている

**解決方法**:

```svelte
<!-- ❌ 非対応 -->
<div class="md:flex">  <!-- : 記号が引っかかる -->

<!-- ✅ 正しい同じ Tailwind -->
<div class="flex" style="display: none;">  <!-- 代わりにここで制御 -->

<!-- または vite で動的クラスが生成されるようにする -->
<div class:flex={isDesktop}>  <!-- Svelte クラス:ディレクティブ -->
```

Tailwind の動的クラスを確認:
```javascript
// tailwind.config.js
module.exports = {
    content: [
        './src/**/*.{svelte,html,js}'  // Svelte ファイルはここにあるか確認
    ]
}
```

---

## デバッグテクニック

### MCP ブラウザ確認

ユーザーの指示があれば、MCP ツールで Chrome を起動し、実際の REST API レスポンスをブラウザで確認できます。
ログインとテストページの URL は以下です。

```
http://localhost/ibi_apps/rs?IBIRS_action=signOn&IBIRS_userName=admin&IBIRS_password=admin&IBIRS_service=ibfs
http://localhost/ibi_apps/rs?IBIRS_action=TEST
```

### 1. ブラウザ DevTools での確認

#### Network タブ
```
1. `/ibi_apps/rs` リクエストをクリック
2. Headers タブで以下を確認:
   - Request Headers: Cookie に JSESSIONID があるか
   - Response Headers: Set-Cookie で CSRF トークンが返されるか
3. Response タブで XML が返されているか HTML ではないか
4. Payload タブでパラメータが正しく送信されているか
```

#### Console タブ
```javascript
// auth Store の内容を確認
// (Svelte ダイレクティブ: $auth を使用している場合)
import { auth } from './stores';
auth.subscribe(state => console.log('auth:', state));

// 直接 fetch テスト
fetch('/ibi_apps/rs?IBIRS_service=ibfs&IBIRS_action=signOn&IBIRS_user=admin&IBIRS_pass=admin', {
    credentials: 'include'
}).then(r => r.text()).then(console.log);
```

### 2. ソースマップの有効化

開発ビルドで TypeScript/Svelte のソースマップを確認:
```javascript
// vite.config.js
export default {
    build: {
        sourcemap: true  // 本番でも有効（デバッグ用）
    }
}
```

### 3. アラート・ログの活用

```javascript
// API モジュールに詳細ログを追加
export async function getContents(path) {
    console.group('getContents 呼び出し');
    console.log('パス:', path);
    console.time('API 実行時間');
    
    try {
        // API 処理...
        console.timeEnd('API 実行時間');
        console.log('結果:', result);
        return result;
    } catch (error) {
        console.error('エラー:', error);
        console.groupEnd();
        throw error;
    }
}
```

---

## よくあるミス チェックリスト

- [ ] `fetch()` に `credentials: 'include'` がない
- [ ] XML パースエラー検出（`xmlDoc.querySelector('parsererror')`）がない
- [ ] 属性取得後にデフォルト値を指定していない
- [ ] HTML エスケープをしていない
- [ ] CSRF トークンを Store に保存していない
- [ ] ローディング中のユーザーフィードバックがない
- [ ] タイムアウト処理がない
- [ ] エラー時の再ログイン処理がない
- [ ] Store 更新時にオブジェクト再割り当てをしていない
- [ ] Tailwind CSS の content パスに Svelte ファイルが含まれていない

---

**参考資料**:
- [MDN: CORS](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS)
- [MDN: DOMParser](https://developer.mozilla.org/ja/docs/Web/API/DOMParser)
- [Svelte docs: Reactive declarations](https://svelte.dev/docs/reactivity)
- [Vite: Server options](https://vitejs.dev/config/server-options.html)
