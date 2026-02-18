# WebFOCUS IBFS (IBI File System) ガイド

WebFOCUS の内部ファイルシステムである IBFS (IBI Repository Service File System) の構造と、リポジトリパスの使用方法を説明します。

## 目次

1. [IBFS とは](#ibfs-とは)
2. [パス体系](#パス体系)
3. [主要パス一覧](#主要パス一覧)
4. [リソースタイプ](#リソースタイプ)
5. [パス操作の実装例](#パス操作の実装例)

---

## IBFS とは

**IBFS (IBI Repository Service File System)** は、WebFOCUS 内部のリポジトリを管理するための仮想ファイルシステムです。

### 特徴

- **階層的な構造**: ファイルシステムのようにフォルダ・ファイルが階層化
- **仮想パス**: 実ファイルシステムではなく、WebFOCUS内部で管理
- **ユーザー・レポート・テンプレート等の統一管理**: すべてのリソースがIBFS内に配置
- **REST API でアクセス**: `/ibi_apps/rs` エンドポイント経由で操作

### 実装例

```javascript
// IBFS パスを指定してコンテンツを取得
const params = new URLSearchParams({
    'IBIRS_action': 'get',
    'IBIRS_path': 'IBFS:/WFC/Repository/reports',
    'IBIRS_service': 'ibfs'
});

const response = await fetch(`/ibi_apps/rs?${params}`);
```

---

## パス体系

### フォーマット

```
IBFS:/[スキーム]/[セグメント]/[セグメント]/...
```

### 例

| パス | 説明 |
|------|------|
| `IBFS:/WFC` | WebFOCUS コア（システムフォルダ） |
| `IBFS:/WFC/Repository` | レポート・ファイルのリポジトリ |
| `IBFS:/WFC/Repository/reports` | デフォルトレポートフォルダ |
| `IBFS:/SSYS/USERS` | ユーザー管理フォルダ |
| `IBFS:/SSYS/GROUPS` | ユーザーグループフォルダ |

### URL エンコード

REST API で URL クエリパラメータ として IBFS パスを使用する場合、**URL エンコード**が必要です。

```javascript
// エンコード前
const path = 'IBFS:/WFC/Repository/reports/report1.fex';

// URL エンコード
const encodedPath = encodeURIComponent(path);
// → "IBFS%3A%2FWFC%2FRepository%2Freports%2Freport1.fex"

// USE 済みURL
const url = `http://localhost/ibi_apps/rs?IBIRS_path=${encodedPath}&IBIRS_action=get`;
```

### デコード例

```javascript
// URLエンコード文字列からデコード
const encodedPath = "IBFS%3A%2FWFC%2FRepository%2Freports";
const path = decodeURIComponent(encodedPath);
// → "IBFS:/WFC/Repository/reports"
```

---

## 主要パス一覧

### システム領域

#### WFC (WebFOCUS Core)

```
IBFS:/WFC/
  ├── Repository/              # レポート・テンプレート等
  │   ├── reports/            # デフォルトレポートフォルダ
  │   ├── charts/             # チャートフォルダ
  │   ├── tables/             # テーブルフォルダ
  │   └── [ユーザーフォルダ]/
  │
  ├── Environment/            # 環境設定
  ├── ReportServer/           # Report Server 関連
  └── [その他システムフォルダ]/
```

#### SSYS (System Area)

```
IBFS:/SSYS/
  ├── USERS/                  # ユーザー管理
  │   ├── admin               # 個別ユーザー
  │   ├── guest
  │   └── [その他ユーザー]/
  │
  ├── GROUPS/                 # グループ管理
  │   ├── [グループ名]/
  │   └── ...
  │
  └── [その他システムリソース]/
```

### アプリケーション領域

独自アプリケーションは通常、以下に配置:

```
IBFS:/WFC/Repository/
  └── [アプリケーション名]/
      ├── reports/
      ├── charts/
      ├── data/
      └── resources/
```

---

## リソースタイプ

### type 属性値

REST API の get アクションは、各リソースの `type` 属性でリソースタイプを示します。

| type 値 | 説明 | 拡張子 |
|---------|------|-------|
| `folder` | フォルダ | (なし) |
| `FexFile` | レポート（Fex） | `.fex` |
| `ChartFile` | チャート定義 | `.gchart` |
| `BitmapFile` | 画像 | `.bmp`, `.jpg` 等 |
| `JavaFile` | Java クラス | `.class` |
| `HTMLFile` | HTML ページ | `.html` |

### 実装例（フォルダと.fex ファイルを区別）

```javascript
const items = xmlDoc.querySelectorAll('item');

items.forEach(item => {
    const name = item.getAttribute('name');
    const objtype = item.querySelector('objtype')?.textContent || 'unknown';
    
    if (objtype === 'folder') {
        console.log(`📁 ${name} (フォルダ)`);
    } else if (name.endsWith('.fex')) {
        console.log(`📊 ${name} (レポート)`);
    } else {
        console.log(`📄 ${name}`);
    }
});
```

---

## パス操作の実装例

### 1. フォルダの内容を取得

```javascript
/**
 * IBFS フォルダの内容を取得
 * @param {string} path - IBFS パス
 * @returns {Promise<Array>} アイテムリスト
 */
async function getFolderContents(path) {
    const params = new URLSearchParams({
        'IBIRS_action': 'get',
        'IBIRS_path': path,
        'IBIRS_service': 'ibfs'
    });

    const response = await fetch(`/ibi_apps/rs?${params}`, {
        method: 'GET',
        credentials: 'include'
    });

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const returncode = xmlDoc.documentElement.getAttribute('returncode');
    if (returncode !== '10000') {
        throw new Error('フォルダ取得失敗');
    }

    const items = [];
    xmlDoc.querySelectorAll('item').forEach(item => {
        items.push({
            name: item.getAttribute('name'),
            type: item.getAttribute('type'),
            fullPath: item.getAttribute('fullPath'),
            description: item.getAttribute('description')
        });
    });

    return items;
}

// 使用例
const reports = await getFolderContents('IBFS:/WFC/Repository/reports');
reports.forEach(r => console.log(r.name));
```

### 2. パスナビゲーション（階層移動）

```javascript
class FolderNavigator {
    constructor() {
        this.currentPath = 'IBFS:/WFC/Repository/reports';
        this.history = [this.currentPath];
    }

    /**
     * 子フォルダへ移動
     */
    async navigateTo(folderName) {
        const newPath = `${this.currentPath}/${folderName}`;
        
        try {
            // パスが存在するか確認
            await getFolderContents(newPath);
            this.currentPath = newPath;
            this.history.push(newPath);
            return true;
        } catch (error) {
            console.error('ナビゲーション失敗:', error);
            return false;
        }
    }

    /**
     * 親フォルダへ戻る
     */
    goBack() {
        if (this.history.length > 1) {
            this.history.pop();
            this.currentPath = this.history[this.history.length - 1];
            return true;
        }
        return false;
    }

    /**
     * パンくずリストを取得
     */
    getBreadcrumb() {
        const segments = this.currentPath.split('/');
        return segments.slice(1).map((segment, idx) => ({
            label: segment,
            path: segments.slice(0, idx + 2).join('/')
        }));
    }
}

// 使用例
const navigator = new FolderNavigator();
navigator.navigateTo('SubFolder');
console.log(navigator.getBreadcrumb());
navigator.goBack();
```

### 3. フォルダ内のすべての .fex ファイルを列挙

```javascript
/**
 * フォルダ内のレポートを取得
 */
async function getReports(folderPath) {
    const items = await getFolderContents(folderPath);
    
    return items.filter(item => {
        return item.name.endsWith('.fex');
    });
}

// 使用例
const reports = await getReports('IBFS:/WFC/Repository/reports');
console.log(`見つかったレポート数: ${reports.length}`);
```

### 4. パスの正規化

```javascript
/**
 * IBFS パスの正規化
 * - 余分なスラッシュを削除
 * - 末尾のスラッシュを削除
 */
function normalizePath(path) {
    // 複数スラッシュを1つに統一
    let normalized = path.replace(/\/+/g, '/');
    
    // 末尾のスラッシュを削除
    normalized = normalized.replace(/\/$/, '');
    
    return normalized;
}

// 使用例
console.log(normalizePath('IBFS://WFC//Repository/reports/'));
// → "IBFS:/WFC/Repository/reports"
```

### 5. パスの親フォルダを取得

```javascript
/**
 * パスの親フォルダを取得
 */
function getParentPath(path) {
    const normalized = normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    
    if (lastSlash <= 4) {  // "IBFS:" より前は削除禁止
        return null;  // 親フォルダなし
    }
    
    return normalized.substring(0, lastSlash);
}

// 使用例
console.log(getParentPath('IBFS:/WFC/Repository/reports/SubFolder'));
// → "IBFS:/WFC/Repository/reports"

console.log(getParentPath('IBFS:/WFC'));
// → null
```

---

## API リファレンス - get アクション

### エンドポイント

```
GET /ibi_apps/rs?IBIRS_action=get&IBIRS_path={path}&IBIRS_service=ibfs
```

### パラメータ

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `IBIRS_action` | ✓ | 固定値: `get` |
| `IBIRS_path` | ✓ | IBFS パス (URL エンコード済み) |
| `IBIRS_service` | ○ | 固定値: `ibfs` |

### レスポンス構造

```xml
<ibfsrpc returncode="10000">
  <rootObject name="reports" fullPath="IBFS:/WFC/Repository/reports">
    <children size="3">
      <item name="report1.fex"
            type="FexFile"
            fullPath="IBFS:/WFC/Repository/reports/report1.fex"
            description="月次売上レポート"
            lastModified="1771191944047">
        <objtype>fex</objtype>
      </item>
      <item name="subfolder"
            type="folder"
            fullPath="IBFS:/WFC/Repository/reports/subfolder"
            description="">
        <objtype>folder</objtype>
      </item>
    </children>
  </rootObject>
</ibfsrpc>
```

### 重要な属性

| 属性 | 説明 |
|------|------|
| `name` | リソース名（ファイル名またはフォルダ名） |
| `fullPath` | 完全な IBFS パス |
| `type` | リソースタイプ (FexFile, folder 等) |
| `description` | リソースの説明 |
| `lastModified` | 最終更新日時 (ミリ秒エポック) |

---

## ホワイトリスト - 推奨される参照パス

以下のパスは一般的に参照可能で、ユーザー入力を受け付けて安全です:

```
IBFS:/WFC/Repository/reports
IBFS:/WFC/Repository/charts
IBFS:/SSYS/USERS
```

**セキュリティ上の注意:**

- ユーザーが任意の IBFS パスを入力できる場合、入力値を**ホワイトリスト**で検証
- システムパス (IBFS:/WFC/Environment など) への無制限アクセスは避ける

---

## トラブルシューティング

### パスが見つからない (returncode: 99)

```
原因: パスが存在しない、または URL エンコード漏れ

対処:
1. encodeURIComponent() を使用して URL エンコード
2. IBFS パスが正確か確認 (例: /SSYS でなく /SSYS/)
3. フォルダトラバーサルを使用せずに親パスをチェック
```

### パーミッション エラー (returncode: 99)

```
原因: ユーザーがそのパスへのアクセス権限がない

対処:
1. ログイン状態を確認
2. WebFOCUS 管理画面でユーザーの権限を確認
3. 別のユーザーでテスト
```

### 期待と異なるアイテムが返される

```
原因: サブフォルダのアイテムも含まれている場合がある

対処:
1. type 属性で folder か FexFile か確認
2. フィルタリング処理で objtype をチェック
3. 必要に応じて depth パラメータがあるか確認
```

---

**作成日**: 2026年2月18日  
**WebFOCUS バージョン**: 9.3.0 以上  
**参考実装**: C:\ibi\apps\rest\index.js
