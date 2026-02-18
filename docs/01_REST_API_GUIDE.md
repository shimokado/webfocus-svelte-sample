# WebFOCUS REST API 詳細実装ガイド

本ガイドは、`C:\ibi\apps\rest\index.js` から読み取れる実装パターンと、参考プロジェクトから得られたベストプラクティスをまとめたものです。

## 目次

1. [ベース URL と共通パラメータ](#ベース-url-と共通パラメータ)
2. [HTTP メソッドの使い分け](#http-メソッドの使い分け)
3. [リクエスト - サインオン](#リクエスト---サインオン)
4. [XML レスポンス解析](#xml-レスポンス解析)
5. [CSRF トークン管理](#csrf-トークン管理)
6. [セッション管理](#セッション管理)
7. [リターンコード一覧](#リターンコード一覧)
8. [エラーハンドリング](#エラーハンドリング)

---

## ベース URL と共通パラメータ

### ベース URL

```
http://localhost/ibi_apps/rs
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

WebFOCUS は localhost (デフォルト) で動作することを前提としています。
本番環境では、WebFOCUS がホストされているサーバーの URL に変更してください。

### 共通パラメータ

すべてのリクエストに含める必須パラメータ:

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `IBIRS_action` | (アクション名) | **必須** - 実行する操作 (例: `signOn`, `get`, `run`, `describeFex`) |
| `IBIRS_service` | `ibfs` | **推奨** - サービス指定（ほとんどの場合 `ibfs`） |

### 出現位置

- **GET リクエスト**: URL クエリパラメータ
- **POST リクエスト**: リクエストボディ (URLエンコード形式)

**GET 例:**

```
http://localhost/ibi_apps/rs?IBIRS_action=signOn&IBIRS_service=ibfs
```

**POST 例:**

```javascript
const params = new URLSearchParams();
params.append('IBIRS_action', 'signOn');
params.append('IBIRS_service', 'ibfs');
params.append('IBIRS_userName', 'admin');
params.append('IBIRS_password', 'admin');

fetch('http://localhost/ibi_apps/rs', {
    method: 'POST',
    body: params.toString()
});
```

---

## HTTP メソッドの使い分け

### GET vs POST

| 操作内容 | メソッド | 理由 |
|---------|---------|------|
| 認証情報を送信 | POST | パスワードなど機密情報はボディに含める |
| データ取得（IBFS パス指定） | GET | 副作用がない読み取り操作 |
| レポート実行 | GET | 結果を直接表示する場合が多い |
| パラメータ値セットが大きい | POST | GET の URL 長制限を回避 |

### 本プロジェクトの方針

- GET リクエストで実行可能なものは GET を使用
- signOn は本来 POST だが、本開発では GET で実装
- `IBIRS_action` ごとの GET/POST は `src/api/webfocus.js` の `ACTION_METHODS` で JSON 管理

---

## WebFOCUS セキュリティ設定の注意点

以下は WebFOCUS 管理コンソール（Security タブ）で確認できる重要ポイントです。
参照: http://localhost/ibi_apps/ibi_help/Default.htm#securityAdmin/admin_console23.htm#Understa5

### 認証方式の概要

- **Internal**: WebFOCUS リポジトリ内で認証と認可を管理
- **External**: AD/LDAP など外部ディレクトリと連携（External Security を有効化）
- Security Zones ごとに **認証方式とリクエスト条件** を切り替え可能（Default/Mobile/Portlet/Alternate）

### セッションとセキュリティ

- セッション ID は JSESSIONID などで管理される（アプリケーションサーバー依存）
- **Session Fixation Protection** を有効化すると、リクエスト単位でセッション ID が再生成される
- **Concurrency Control** で同一ユーザーの同時セッション数を制限可能

### 同一 Origin と Cross-Origin の違い

- **同一 Origin**: スキーム/ホスト/ポートが一致する URL（例: http://localhost/approot/...）
- **Cross-Origin**: いずれかが異なる URL（例: http://localhost:5173 から http://localhost/ibi_apps）

### Cross-Origin の許可設定

Security Zone の Authentication ページ → Cross-Origin Settings から設定:

- **Allow Embedding**: iframe 埋め込み可否を制御（X-Frame-Options / CSP に影響）
- **Allow Cross-Origin Resources Sharing (CORS)**: Ajax のクロスオリジン可否を制御
- **Allowed Origins**: 許可する Origin をカンマ区切りで列挙（scheme/host/port 必須）

### Allowed Host Names（ホストヘッダ制限）

- Authentication Options の **Allowed host names** に許可ホストを列挙
- ワイルドカード `*` は全許可。運用時はホワイトリスト推奨

### 重要な運用メモ

- Cross-Origin を利用する場合は **Security Zone ごとに** 設定が必要
- **同一 Origin（approot 配下）での利用** は CORS 回避として最も安定
- 設定変更後は **Save → Clear Cache/Reload** が必要

### 参考実装パターン

**POST (サインオン):**

```javascript
const response = await fetch('http://localhost/ibi_apps/rs', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: params.toString()
});
```

**GET (一覧取得):**

```javascript
const url = 'http://localhost/ibi_apps/rs?IBIRS_action=get&IBIRS_path=IBFS:/WFC/Repository/reports&IBIRS_service=ibfs';
const response = await fetch(url, { method: 'GET' });
```

---

## リクエスト - サインオン

### 処理フロー

```
1. HTML フォーム入力 (ユーザー名・パスワード)
   ↓
2. URLEncodedParams に変換
   ↓
3. GET /ibi_apps/rs に送信（本開発）
   ↓
4. XML レスポンス受信
   ↓
5. DOMParser で解析
   ↓
6. CSRF トークン抽出（重要！）
   ↓
7. ユーザー情報表示 / エラー表示
```

### サンプル実装 (Vanilla JS)

```javascript
// ステップ 1-2: フォーム取得と URLEncode
const userName = document.getElementById('userName').value;
const password = document.getElementById('password').value;

const params = new URLSearchParams();
params.append('IBIRS_action', 'signOn');
params.append('IBIRS_userName', userName);
params.append('IBIRS_password', password);
params.append('IBIRS_service', 'ibfs');

// ステップ 3: GET リクエスト（本開発）
const url = `http://localhost/ibi_apps/rs?${params.toString()}`;
const response = await fetch(url, {
    method: 'GET'
});

// ステップ 4-5: レスポンス受信と XML 解析
const xmlText = await response.text();
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

// エラーハンドリング
if (xmlDoc.querySelector('parsererror')) {
    throw new Error('XMLパースエラー');
}

// ステップ 6: CSRF トークン抽出（後述）
const propertiesElement = xmlDoc.querySelector('properties');
// ...
```

---

## XML レスポンス解析

### 共通レスポンス構造

```xml
<ibfsrpc returncode="10000" returndesc="SUCCESS">
  <!-- レスポンスボディ -->
</ibfsrpc>
```

### 解析パターン

**1. ルート要素取得 + 結果チェック**

```javascript
const ibfsrpc = xmlDoc.querySelector('ibfsrpc');
const returncode = ibfsrpc.getAttribute('returncode');
const returndesc = ibfsrpc.getAttribute('returndesc');

if (returncode !== '10000') {
    console.error(`API エラー: ${returndesc}`);
}

**2. ルートオブジェクト配下の一覧取得**

実際のレスポンスでは `rootObject > children > item` が返ります。

```javascript
const container = xmlDoc.querySelector('ibfsobject') || xmlDoc.querySelector('rootObject');
const children = container?.querySelector('children');
const items = children ? Array.from(children.querySelectorAll('item')) : [];
```

**3. 型の判定（MRFolder / FexFile）**

```javascript
const type = item.getAttribute('type') || '';
const typeLower = type.toLowerCase();
const isFolder = typeLower === 'folder' || typeLower === 'mrfolder';
const isFex = typeLower === 'fexfile' || name.toLowerCase().endsWith('.fex');
```
```

**2. entry 要素パターン（キー・バリュー）**

```xml
<properties>
  <entry key="IBI_CSRF_Token_Name" value="IBIwfXsrfToken"/>
  <entry key="IBI_CSRF_Token_Value" value="abc123..."/>
</properties>
```

**解析コード:**

```javascript
const propertiesElement = xmlDoc.querySelector('properties');
const entries = propertiesElement.querySelectorAll('entry');

const properties = {};
for (const entry of entries) {
    const key = entry.getAttribute('key');
    const value = entry.getAttribute('value');
    properties[key] = value;
}

// 使用
console.log(properties['IBI_CSRF_Token_Value']);
```

**3. item リスト パターン（子要素のリスト）**

```xml
<rootObject name="reports">
  <children size="3">
    <item name="report1.fex" 
          type="FexFile"
          fullPath="IBFS:/WFC/Repository/reports/report1.fex"
          description="レポート1"/>
    <!-- 他のアイテム -->
  </children>
</rootObject>
```

**解析コード:**

```javascript
const items = xmlDoc.querySelectorAll('rootObject > children > item');
const list = Array.from(items).map(item => ({
    name: item.getAttribute('name'),
    type: item.getAttribute('type'),
    fullPath: item.getAttribute('fullPath'),
    description: item.getAttribute('description')
}));
```

**4. 日付タイムスタンプ パターン**

WebFOCUS は **ミリ秒単位のエポック値** で日付を返します。

```xml
<item lastSignin="1771191678150" lastModified="1771191944047"/>
```

**変換コード:**

```javascript
function formatTimestamp(value) {
    if (!value) return '-';
    const timestamp = Number(value);
    if (Number.isNaN(timestamp)) return '-';
    return new Date(timestamp).toLocaleString('ja-JP');
}

const displayDate = formatTimestamp(item.getAttribute('lastSignin'));
// → "2025/2/1 12:34:56"
```

---

## CSRF トークン管理

### なぜ必要か

WebFOCUS は **CSRF (Cross-Site Request Forgery) 攻撃** から保護するため、トークンベースの検証を採用しています。

- **POST リクエストでは必須**
- GET リクエストではトークンは不要（一般的）

### サインオンレスポンスから抽出

```xml
<ibfsrpc returncode="10000">
  <properties>
    <entry key="IBI_CSRF_Token_Name" value="IBIwfXsrfToken"/>
    <entry key="IBI_CSRF_Token_Value" value="c0804e60e5ecf5d8..."/>
  </properties>
</ibfsrpc>
```

**抽出処理:**

```javascript
let csrfTokenName = '';
let csrfTokenValue = '';

const entries = xmlDoc.querySelectorAll('properties > entry');
for (const entry of entries) {
    const key = entry.getAttribute('key');
    const value = entry.getAttribute('value');
    
    if (key === 'IBI_CSRF_Token_Name') {
        csrfTokenName = value;  // 通常 "IBIwfXsrfToken"
    } else if (key === 'IBI_CSRF_Token_Value') {
        csrfTokenValue = value;  // トークン値
    }
}

console.log(`トークン名: ${csrfTokenName}`);
console.log(`トークン値: ${csrfTokenValue}`);
```

### POST リクエストで利用

```javascript
const params = new URLSearchParams();
params.append('IBIRS_action', 'put');
params.append('IBIwfXsrfToken', csrfTokenValue);  // ← トークンを含める
// ... その他パラメータ

const response = await fetch('http://localhost/ibi_apps/rs', {
    method: 'POST',
    body: params.toString()
});
```

---

## セッション管理

### Cookie による自動管理

WebFOCUS はサーバーサイドセッションを **JSESSIONID Cookie** で管理します。

**サインオン後のレスポンスヘッダ:**

```
Set-Cookie: JSESSIONID=abc123xyz789; Path=/; HttpOnly
```

### JavaScript での処理

ブラウザの Fetch API は **デフォルトで Cookie を送信しません**。

明示的に `credentials` オプションを設定する必要があります。

**修正前（Cookie 送信されない）:**

```javascript
const response = await fetch(url, { method: 'GET' });
// ❌ Cookie が含まれない
```

**修正後（Cookie 自動送信）:**

```javascript
const response = await fetch(url, {
    method: 'GET',
    credentials: 'include'  // ← これが重要
});
// ✅ Cookie が自動的に送信される
```

### 参考実装

後続リクエストすべてに `credentials: 'include'` を付与しましょう。

```javascript
async function getReportList() {
    const response = await fetch(reportListUrl, {
        method: 'GET',
        credentials: 'include'  // サーバーが Cookie を検証できる
    });
    // ...
}
```

---

## リターンコード一覧

### 主要コード

| コード | 意味 | 処理 |
|-------|------|------|
| `10000` | ✓ 成功 | 結果を正常処理 |
| `0` | ✓ 成功 (代替) | 結果を正常処理 |
| `99` | ❌ エラー | `returndesc` にエラー内容 |
| `10001` | ⚠ 警告 | 処理は実行されたが注意 |
| `10002` | ℹ 情報 | 処理が実行されたが情報通知 |

### 参考実装

```javascript
const returncode = xmlDoc.documentElement.getAttribute('returncode');
const returndesc = xmlDoc.documentElement.getAttribute('returndesc');

if (returncode === '10000' || returncode === '0') {
    // ✓ 成功処理
    console.log('成功:', returndesc);
} else if (returncode === '99') {
    // ❌ エラー処理
    console.error('API エラー:', returndesc);
    throw new Error(returndesc);
} else if (returncode === '10001') {
    // ⚠ 警告処理
    console.warn('警告:', returndesc);
    // 処理は続行
} else {
    // その他
    console.log(`不明なコード: ${returncode}`);
}
```

---

## エラーハンドリング

### 3層のエラー

#### 1. ネットワークエラー

```javascript
try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
} catch (error) {
    console.error('ネットワークエラー:', error.message);
    // サーバーに接続できない
}
```

#### 2. XML パースエラー

```javascript
const xmlText = await response.text();
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

if (xmlDoc.querySelector('parsererror')) {
    console.error('XML パースエラー - サーバーが不正な応答');
    throw new Error('XMLパースエラー');
}
```

#### 3. API エラー

```javascript
const returncode = xmlDoc.documentElement.getAttribute('returncode');
const returndesc = xmlDoc.documentElement.getAttribute('returndesc');

if (returncode !== '10000') {
    console.error(`API エラー (${returncode}): ${returndesc}`);
    throw new Error(returndesc);
}
```

### ユーザーに表示するエラーメッセージ

```javascript
try {
    // API 呼び出し
} catch (error) {
    // ① エラーを分類
    let userMessage = '';
    
    if (error.message.includes('HTTP')) {
        userMessage = 'サーバーに接続できません。WebFOCUSが起動しているか確認してください。';
    } else if (error.message.includes('XML')) {
        userMessage = 'サーバーから不正な応答が返されました。';
    } else if (error.message.includes('Invalid credentials')) {
        userMessage = 'ユーザー名またはパスワードが誤っています。';
    } else {
        userMessage = `エラーが発生しました: ${error.message}`;
    }
    
    // ② UI に表示
    document.getElementById('errorDiv').textContent = userMessage;
}
```

---

## 推奨される実装チェックリスト

- [ ] ベース URL を定数化している（環境依存）
- [ ] すべてのフェッチで `credentials: 'include'` を指定
- [ ] XML パースエラーを明示的にチェック
- [ ] リターンコード `10000` のみを成功と判定
- [ ] ユーザー入力値を `escapeHtml()` でエスケープ
- [ ] エラーメッセージをコンソールに出力（デバッグ）
- [ ] タイムスタンプを日付オブジェクトに変換
- [ ] 日付表示は `toLocaleString('ja-JP')` で日本語フォーマット
- [ ] キャッシュ回避のため `IBIRS_random` パラメータを追加（オプション）

---

**作成日**: 2026年2月18日  
**参考実装**: C:\ibi\apps\rest\index.js (Vanilla JS, 676行)
