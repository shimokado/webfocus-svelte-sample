# WebFOCUS REST API 実装ベストプラクティス

参考実装 `C:\ibi\apps\rest\index.js` から読み取れる、堅牢で保守性の高い実装パターンをまとめました。

## 目次

1. [エラーハンドリング](#エラーハンドリング)
2. [XML 解析](#xml-解析)
3. [セキュリティ](#セキュリティ)
4. [UI レンダリング](#ui-レンダリング)
5. [コード構成](#コード-構成)
6. [パフォーマンス](#パフォーマンス)
7. [テスト容易性](#テスト容易性)

---

## エラーハンドリング

### 3層のエラー検出

参考実装では、以下の3層でエラーをハンドルしています：

#### 層1: ネットワークエラー

```javascript
try {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
} catch (error) {
    console.error('ネットワークエラー:', error);
    // ユーザーフレンドリーなメッセージを表示
    showError('サーバーに接続できません。WebFOCUSが起動しているか確認してください。');
}
```

#### 層2: XML パースエラー

```javascript
const xmlText = await response.text();
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

// XML パースエラーの確認（重要！）
if (xmlDoc.querySelector('parsererror')) {
    throw new Error('XMLパースエラー');
}
```

**なぜ重要か:**
- `DOMParser` はパースに失敗しても Exception を投げない
- 代わりに `<parsererror>` 要素を含むドキュメントを返す
- 明示的にチェック**必須**

#### 層3: API ロジックエラー

```javascript
const ibfsrpc = xmlDoc.querySelector('ibfsrpc');
if (!ibfsrpc) {
    throw new Error('レスポンス形式エラー');
}

const returncode = ibfsrpc.getAttribute('returncode');
const returndesc = ibfsrpc.getAttribute('returndesc');

if (returncode !== '10000') {
    // API が返したエラーメッセージをユーザーに表示
    throw new Error(`API Error: ${returndesc}`);
}
```

### ユーザーフレンドリーなエラー表示

```javascript
function displayError(returncode, returndesc) {
    const resultDiv = document.getElementById('result');
    resultDiv.className = 'error';
    resultDiv.innerHTML = `
        <div class="result-title">❌ エラーが発生しました</div>
        <div class="result-content">
            ${returncode ? `<p><strong>コード:</strong> ${escapeHtml(returncode)}</p>` : ''}
            <p><strong>メッセージ:</strong> ${escapeHtml(returndesc)}</p>
        </div>
    `;
    resultDiv.style.display = 'block';
}
```

### 推奨事項

✅ **DO:**
- エラーをコンソールに記録（デバッグ用）
- ユーザーに分かりやすいメッセージを表示
- エラーごとに適切な UI フィードバックを提供

❌ **DON'T:**
- エラーの詳細情報をユーザーに直接表示（セキュリティリスク）
- スタックトレースをコンソール以外に表示
- エラーを無視して処理を継続

---

## XML 解析

### querySelector vs querySelectorAll

参考実装では適切に使い分けされています：

```javascript
// 単数形の要素取得には querySelector
const ibfsrpc = xmlDoc.querySelector('ibfsrpc');
const rootObject = xmlDoc.querySelector('rootObject');
const propertiesElement = xmlDoc.querySelector('properties');

// 複数形の要素取得には querySelectorAll
const items = xmlDoc.querySelectorAll('rootObject > children > item');
const entries = propertiesElement.querySelectorAll('entry');
```

### 属性値取得のパターン

```javascript
// getAttribute は常に文字列を返す（属性がない場合は null）
const name = item.getAttribute('name');
const value = item.getAttribute('value') || '';  // デフォルト値

// 存在確認と値取得を組み合わせ
const description = item.getAttribute('description') || item.getAttribute('rawDescription') || '';
```

### 子要素の確認

```javascript
// オプショナルなセレクタの場合は `?.` を使用
const objtype = item.querySelector('objtype')?.textContent || 'unknown';

// または条件分岐
const typeElem = item.querySelector('objtype');
const objtype = typeElem ? typeElem.textContent : 'unknown';
```

### 推奨される解析パターン

```javascript
/**
 * ユーザー一覧を XML から抽出
 */
function parseUserList(xmlDoc) {
    const users = [];
    
    const items = xmlDoc.querySelectorAll('rootObject > children > item');
    
    items.forEach((item) => {
        users.push({
            name: item.getAttribute('name') || '',
            description: item.getAttribute('description') || 
                        item.getAttribute('rawDescription') || '',
            status: item.getAttribute('userStatusDisplay') || '',
            type: item.getAttribute('typeDescription') || '',
            fullPath: item.getAttribute('fullPath') || '',
            lastSignin: formatLastSignin(item.getAttribute('lastSignin'))
        });
    });
    
    return users;
}
```

---

## セキュリティ

### HTML エスケープ

参考実装では、ユーザーデータを表示する際に必ずエスケープしています。

```javascript
function escapeHtml(value) {
    // 最低限の HTML エスケープ
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 使用例
const html = `<td>${escapeHtml(user.name)}</td>`;
```

### onclick ハンドラでのエスケープ

```javascript
// ❌ 危険（XSS 脆弱性）
const card = `<button onclick="runReport('${report.fullPath}')">実行</button>`;

// ✅ 安全（属性値を HTML エスケープ）
const card = `<button onclick="runReport('${escapeHtml(report.fullPath).replace(/'/g, '&#39;')}')">実行</button>`;
```

### URLエンコード

```javascript
// API へ送信するパラメータは URL エンコード
const encodedPath = encodeURIComponent(fexPath);
const url = `http://localhost/ibi_apps/rs?IBIRS_path=${encodedPath}&IBIRS_action=run`;
```

---

## UI レンダリング

### イベントリスナーの管理

参考実装では、`addEventListener` を用いて複数のリスナーを登録しています。

```javascript
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // フォーム処理
});

document.getElementById('userListForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // ユーザ一覧取得
});

document.getElementById('reportListForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // レポート一覧取得
});
```

### 推奨事項

✅ **DO:**
- 各フォームに独立したリスナーを登録
- `e.preventDefault()` で既定の送信を防止
- async/await で非同期処理を管理

❌ **DON'T:**
- `onsubmit` 属性でハンドラを直接指定（スケーラビリティ低）
- 同期的な API 呼び出し（ブロッキング）

### テーブル / カード レンダリング

```javascript
function renderUserTable(users) {
    const rows = users.map((user) => {
        return `
            <tr>
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.description)}</td>
                <td>${escapeHtml(user.status)}</td>
                <td>${escapeHtml(user.type)}</td>
                <td>${escapeHtml(user.fullPath)}</td>
                <td>${escapeHtml(user.lastSignin)}</td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="table-wrap">
            <table class="user-table">
                <thead>
                    <tr>
                        <th>ユーザ名</th>
                        <th>説明</th>
                        <th>状態</th>
                        <th>種別</th>
                        <th>パス</th>
                        <th>最終サインイン</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
    
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
}
```

### 推奨事項

✅ **DO:**
- `array.map()` でリスト を HTML 文字列に変換
- 各要素を `escapeHtml()` でエスケープ
- `.join('')` で連結前に配列にまとめる

❌ **DON'T:**
- ループで `innerHTML += ...` する（パフォーマンス低下）
- ユーザーデータをエスケープなしで HTML に挿入

---

## コード 構成

### 関数ごとの責務分離

参考実装は以下の責務を明確に分離しています：

```
1. イベント処理層
   - フォーム送信ハンドラ
   - API 呼び出し リクエスト構築

2. データ処理層
   - XML 解析
   - 形式変換（タイムスタンプなど）
   - パラメータ抽出

3. UI レンダリング層
   - HTML 生成
   - DOM 操作
   - エラー表示
```

### 関数設計例

```javascript
// ❌ 責任が混在（複雑で再利用困難）
async function handleUserListFormSubmit(e) {
    e.preventDefault();
    const response = await fetch(...);
    const xmlText = await response.text();
    const xmlDoc = parser.parseFromString(...);
    
    const users = [];
    xmlDoc.querySelectorAll('item').forEach(...);  // ← 解析ロジック
    
    const html = users.map(...).join('');  // ← レンダリング
    document.getElementById('result').innerHTML = html;
}

// ✅ 責任を分離（再利用可能）
async function handleUserListFormSubmit(e) {
    e.preventDefault();
    const xmlText = await fetch(...).then(r => r.text());
    const users = parseUserList(xmlText);
    renderUserTable(users);
}

function parseUserList(xmlText) {
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    // 解析ロジック
    return users;
}

function renderUserTable(users) {
    const html = users.map(...).join('');
    // UI レンダリング
    document.getElementById('result').innerHTML = html;
}
```

---

## パフォーマンス

### キャッシュ回避

参考実装では、ブラウザキャッシュを避けるため URL に時刻を含めています（オプション）：

```javascript
// キャッシュされる可能性
const url = `http://localhost/ibi_apps/rs?IBIRS_path=...&IBIRS_action=get`;

// キャッシュを回避（IBIRS_random パラメータ）
const url = `http://localhost/ibi_apps/rs?IBIRS_path=...&IBIRS_action=get&IBIRS_random=${Math.random()}`;
```

### DOM の効率的な更新

```javascript
// ❌ 複数回の DOM 操作（遅い）
users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${user.name}</td>`;
    table.appendChild(row);  // ← 毎回リフロー発生
});

// ✅ 一度に更新（速い）
const html = users.map(user => `<tr><td>${user.name}</td></tr>`).join('');
table.innerHTML = html;  // ← 一度だけ実行
```

---

## テスト容易性

### モック可能な設計

参考実装を拡張する際は、テスト容易性も考慮しましょう。

```javascript
// ❌ テスト困難（fetch がハードコーディング）
async function getUsers() {
    const response = await fetch('http://localhost/ibi_apps/rs?...');
    return parseUserList(await response.text());
}

// ✅ テスト容易（fetch をインジェクト可能）
async function getUsers(fetchFn = fetch) {
    const response = await fetchFn('http://localhost/ibi_apps/rs?...');
    return parseUserList(await response.text());
}

// テスト時
test('parse users', async () => {
    const mockResponse = {
        text: () => Promise.resolve(mockXml)
    };
    const mockFetch = () => Promise.resolve(mockResponse);
    
    const users = await getUsers(mockFetch);
    assert.equal(users.length, 3);
});
```

---

## まとめ：参考実装の強み

参考実装（`C:\ibi\apps\rest\index.js`）から学べる主な強み：

| ポイント | 実装内容 |
|--------|---------|
| **エラー処理** | 3層エラーハンドリング + 親切なエラー表示 |
| **セキュリティ** | HTML エスケープ、URL エンコードを徹底 |
| **読みやすさ** | 関数名を明確に、責務を分離 |
| **デバッグ性** | console.error で詳細ログを出力 |
| **UX** | ユーザーに対してクリアなフィードバック |

これらのパターンを新規プロジェクトに適用することをお勧めします。

---

**作成日**: 2026年2月18日  
**参考実装**: C:\ibi\apps\rest\index.js (676行)  
**分析対象**: ユーザー一覧、レポート一覧、カスタム実行機能
