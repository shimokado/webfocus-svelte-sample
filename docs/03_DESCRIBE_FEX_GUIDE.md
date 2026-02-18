# describeFex API - レポートパラメータ定義ガイド

`describeFex` API を使用してレポートのメタデータを取得し、パラメータ定義を抽出する方法を詳しく説明します。

このガイドは `C:\ibi\apps\rest\index.js` の `runCustomReport()` 関数から読み取った実装パターンに基づいています。

## 目次

1. [概要](#概要)
2. [API エンドポイント](#api-エンドポイント)
3. [レスポンス構造](#レスポンス構造)
4. [パラメータ抽出ロジック](#パラメータ抽出ロジック)
5. [パラメータタイプの判定](#パラメータタイプの判定)
6. [選択肢の取得](#選択肢の取得)
7. [実装例](#実装例)

---

## 概要

### 目的

`describeFex` API は、Fex (WebFOCUSレポート) ファイルのメタデータを取得します。

特に重要なのは、レポートが受け入れることができる **パラメータ定義** の取得です。

### 処理フロー

```
1. Fex ファイルパスを指定
   ↓
2. describeFex API を呼び出し
   ↓
3. XML レスポンス受信
   ↓
4. <amperMap><entry type="unresolved"> を抽出
   ↓
5. パラメータ名・型・選択肢を解析
   ↓
6. モーダルで入力フォーム生成
   ↓
7. ユーザーが値を入力
   ↓
8. run API でパラメータを指定して実行
```

---

## API エンドポイント

### リクエスト

```
GET /ibi_apps/rs?IBIRS_action=describeFex&IBIRS_path={encodedPath}
```

### パラメータ

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `IBIRS_action` | ✓ | 固定値: `describeFex` |
| `IBIRS_path` | ✓ | Fex ファイルの IBFS パス (URL エンコード済み) |

### 実装例

```javascript
async function describeFex(fexPath) {
    const encodedPath = encodeURIComponent(fexPath);
    const url = `/ibi_apps/rs?IBIRS_action=describeFex&IBIRS_path=${encodedPath}`;
    
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.text();
}
```

---

## レスポンス構造

### 全体構造

```xml
<ibfsrpc returncode="10000" returndesc="SUCCESS">
  <amperMap>
    <!-- パラメータ定義 -->
    <entry type="unresolved">
      <!-- ユーザー入力が必要 -->
    </entry>
    <entry type="resolved">
      <!-- 固定値 -->
    </entry>
  </amperMap>
</ibfsrpc>
```

### 詳細構造

#### unresolved パラメータ（ユーザー入力が必要）

```xml
<entry type="unresolved">
  <value name="REGION"
         description="地域"
         displayType="prompt">
    <type name="unresolved"/>
    <values>
      <entry>
        <key value="APAC"/>
        <value value="APAC"/>
      </entry>
      <entry>
        <key value="EMEA"/>
        <value value="EMEA"/>
      </entry>
      <entry>
        <key value="Americas"/>
        <value value="Americas"/>
      </entry>
    </values>
  </value>
</entry>
```

#### resolved パラメータ（固定値 - 無視可）

```xml
<entry type="resolved">
  <value name="START_DATE"
         description="開始日"
         displayType="prompt">
    <type name="resolved"/>
    <values/>
  </value>
</entry>
```

---

## パラメータ抽出ロジック

### ステップ 1: XML を解析し amperMap を取得

```javascript
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

// エラーチェック
if (xmlDoc.querySelector('parsererror')) {
    throw new Error('XML パースエラー');
}

// amperMap を取得
const amperMap = xmlDoc.querySelector('amperMap');
if (!amperMap) {
    console.warn('パラメータなし');
    return [];
}
```

### ステップ 2: type="unresolved" のエントリを抽出

```javascript
const params = [];
const entries = amperMap.querySelectorAll('entry[type="unresolved"] > value');

for (const entry of entries) {
    const paramName = entry.getAttribute('name');
    const description = entry.getAttribute('description') || paramName;
    const displayType = entry.getAttribute('displayType') || 'prompt';
    
    // 選択肢を取得
    const valuesElement = entry.querySelector('values');
    const options = [];
    
    if (valuesElement) {
        const optionEntries = valuesElement.querySelectorAll('entry');
        for (const optEntry of optionEntries) {
            const key = optEntry.querySelector('key')?.getAttribute('value');
            const value = optEntry.querySelector('value')?.getAttribute('value');
            if (key && value) {
                options.push({ key, value });
            }
        }
    }
    
    params.push({
        name: paramName,
        description: description,
        displayType: displayType,
        options: options
    });
}

return params;
```

### ステップ 3: 完全実装

```javascript
/**
 * Fex ファイルのパラメータ定義を抽出
 * @param {string} xmlText - describeFex のレスポンス XML
 * @returns {Array} パラメータオブジェクト配列
 *   - { name, description, displayType, options:[{key, value}] }
 */
function extractParameters(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // バリデーション
    if (xmlDoc.querySelector('parsererror')) {
        throw new Error('XMLパースエラー');
    }
    
    const returncode = xmlDoc.documentElement.getAttribute('returncode');
    if (returncode !== '10000') {
        const desc = xmlDoc.documentElement.getAttribute('returndesc');
        throw new Error(`API エラー: ${desc}`);
    }
    
    // パラメータ抽出
    const params = [];
    const amperMap = xmlDoc.querySelector('amperMap');
    
    if (!amperMap) {
        return [];  // パラメータなし
    }
    
    const entries = amperMap.querySelectorAll('entry[type="unresolved"] > value');
    
    for (const entry of entries) {
        const name = entry.getAttribute('name');
        const description = entry.getAttribute('description') || name;
        const displayType = entry.getAttribute('displayType') || 'prompt';
        
        // 選択肢を取得
        const options = [];
        const valuesElem = entry.querySelector('values');
        
        if (valuesElem) {
            valuesElem.querySelectorAll('entry').forEach(optEntry => {
                const keyElem = optEntry.querySelector('key');
                const valElem = optEntry.querySelector('value');
                
                if (keyElem && valElem) {
                    const key = keyElem.getAttribute('value');
                    const value = valElem.getAttribute('value');
                    
                    if (key && value) {
                        options.push({ key, value });
                    }
                }
            });
        }
        
        params.push({
            name,
            description,
            displayType,
            options
        });
    }
    
    return params;
}
```

---

## パラメータタイプの判定

### displayType による判定

| displayType | UI要素 | 説明 |
|------------|--------|------|
| `prompt` | テキストボックス | テキスト入力 |
| `dropdown` | ドロップダウン | 複数選択肢から選択 |
| `radio` | ラジオボタン | 排他的選択 |
| `checkbox` | チェックボックス | 複数選択 |

### 実装パターン

オプションがあるかどうかで判定することもできます：

```javascript
function getInputType(param) {
    if (param.options && param.options.length > 0) {
        // 選択肢がある → SELECT フィールド
        return 'select';
    } else {
        // 選択肢がない → TEXT フィールド
        return 'text';
    }
}

// 使用例
params.forEach(param => {
    const inputType = getInputType(param);
    if (inputType === 'select') {
        renderSelectField(param);
    } else {
        renderTextInput(param);
    }
});
```

---

## 選択肢の取得

### XML 構造の詳細

```xml
<values>
  <entry>
    <key value="表示ラベル"/>
    <value value="実際の値"/>
  </entry>
  <entry>
    <key value="Next Label"/>
    <value value="next_value"/>
  </entry>
</values>
```

### 抽出実装

```javascript
function extractOptions(valuesElement) {
    const options = [];
    
    // querySelectorAll は動作保証
    const entries = valuesElement.querySelectorAll('entry');
    
    for (const entry of entries) {
        // key 要素と value 要素を取得
        const keyElement = entry.querySelector('key');
        const valueElement = entry.querySelector('value');
        
        if (keyElement && valueElement) {
            const label = keyElement.getAttribute('value');
            const value = valueElement.getAttribute('value');
            
            if (label && value) {
                options.push({
                    label: label,
                    value: value
                });
            }
        }
    }
    
    return options;
}
```

---

## 実装例

### 完全なカスタム実行フロー

```javascript
/**
 * カスタム実行フロー
 */
async function runCustomReport(fexPath) {
    try {
        // ステップ 1: describeFex で定義を取得
        console.log('パラメータ定義を取得中...');
        const encodedPath = encodeURIComponent(fexPath);
        const describeUrl = `/ibi_apps/rs?IBIRS_action=describeFex&IBIRS_path=${encodedPath}`;
        
        const response = await fetch(describeUrl, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const xmlText = await response.text();
        
        // ステップ 2: パラメータを抽出
        const params = extractParameters(xmlText);
        
        // ステップ 3: パラメータがない場合は通常実行
        if (params.length === 0) {
            console.log('パラメータなし → 通常実行');
            runReport(fexPath);
            return;
        }
        
        // ステップ 4: ユーザーに入力フォームを表示
        console.log(`パラメータ数: ${params.length}`);
        showParameterForm(fexPath, params);
        
    } catch (error) {
        console.error('カスタム実行エラー:', error);
        alert(`エラー: ${error.message}`);
    }
}

/**
 * パラメータ入力フォームを表示
 */
function showParameterForm(fexPath, params) {
    // モーダルダイアログを表示
    const modal = document.createElement('div');
    modal.className = 'parameter-modal';
    
    const formHTML = params.map(param => {
        const inputType = getInputType(param);
        
        if (inputType === 'select' && param.options.length > 0) {
            // SELECT フィールド
            const optionsHTML = param.options
                .map(opt => `<option value="${opt.value}">${opt.key}</option>`)
                .join('');
            
            return `
                <div class="form-group">
                    <label>${param.description}</label>
                    <select name="${param.name}">
                        ${optionsHTML}
                    </select>
                </div>
            `;
        } else {
            // TEXT フィールド
            return `
                <div class="form-group">
                    <label>${param.description}</label>
                    <input type="text" name="${param.name}" />
                </div>
            `;
        }
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>パラメータを入力</h2>
            <form id="paramForm">
                ${formHTML}
                <button type="submit">実行</button>
                <button type="button" onclick="this.form.closest('.parameter-modal').remove()">キャンセル</button>
            </form>
        </div>
    `;
    
    // フォーム送信ハンドラ
    const form = modal.querySelector('form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // フォーム値を収集
        const formData = new FormData(form);
        const paramValues = Object.fromEntries(formData);
        
        // 実行
        await runReportWithParams(fexPath, paramValues);
        
        // モーダルを閉じる
        modal.remove();
    });
    
    document.body.appendChild(modal);
}

/**
 * パラメータ付きでレポートを実行
 */
async function runReportWithParams(fexPath, paramValues) {
    const encodedPath = encodeURIComponent(fexPath);
    const params = new URLSearchParams({
        'IBIRS_action': 'run',
        'IBIRS_path': fexPath
    });
    
    // パラメータを追加
    Object.entries(paramValues).forEach(([key, value]) => {
        params.append(key, value);
    });
    
    // 実行
    const runUrl = `/ibi_apps/rs?${params}`;
    window.open(runUrl, '_blank');
}
```

### HTML フォーム版

```html
<!-- パラメータ入力フォーム -->
<div id="parameterModal" class="modal">
    <div class="modal-content">
        <h2>レポートパラメータ</h2>
        <form id="paramForm">
            <!-- パラメータがここに動的に生成される -->
        </form>
        <div class="modal-buttons">
            <button onclick="submitParameters()">実行</button>
            <button onclick="closeModal()">キャンセル</button>
        </div>
    </div>
</div>

<script>
async function submitParameters() {
    const form = document.getElementById('paramForm');
    const formData = new FormData(form);
    const paramValues = Object.fromEntries(formData);
    
    await runReportWithParams(currentFexPath, paramValues);
}
</script>
```

---

## エラーハンドリング

### エラーチェック

```javascript
try {
    const xmlText = await response.text();
    
    // ① XML パースエラー
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    if (xmlDoc.querySelector('parsererror')) {
        throw new Error('XMLパースエラー');
    }
    
    // ② API エラー
    const returncode = xmlDoc.documentElement.getAttribute('returncode');
    if (returncode !== '10000') {
        const desc = xmlDoc.documentElement.getAttribute('returndesc');
        throw new Error(`API エラー (${returncode}): ${desc}`);
    }
    
    // ③ データ抽出エラー
    const params = extractParameters(xmlText);
    if (params.length === 0) {
        console.warn('パラメータが定義されていません');
    }
    
} catch (error) {
    console.error('エラーが発生しました:', error.message);
    alert(`描述取得失敗: ${error.message}`);
}
```

---

## 推奨される実装チェックリスト

- [ ] `encodeURIComponent()` で Fex パスを URL エンコード
- [ ] `credentials: 'include'` でセッション Cookie を送信
- [ ] XML パースエラーを明示的にチェック
- [ ] `returncode === '10000'` を成功条件にしている
- [ ] `type="unresolved"` のみを抽出している
- [ ] 選択肢があるかで INPUT/SELECT を判定している
- [ ] パラメータがない場合は通常実行にフォールバック
- [ ] パラメータ値を run API に渡す際に URL エンコード対象に含める
- [ ] ユーザー入力値を `escapeHtml()` でエスケープ
- [ ] displayType 属性を参考に UI を最適化している

---

## トラブルシューティング

### パラメータが表示されない

```
原因: type="unresolved" を正しく抽出できていない

対処:
1. 実際の XML レスポンスをコンソール出力
2. amperMap > entry[type="unresolved"] > value を確認
3. querySelectorAll の構文を確認
```

### 選択肢が空

```
原因: <values> 要素が存在するがエントリがない

対処:
1. values 要素の有無を確認
2. entry > key/value の属性名を確認 (value 属性か内容か)
3. フィールド標的なら opt-in でテキスト入力
```

### パラメータ実行時に 99 エラー

```
原因: パラメータ値が不正または形式が合わない

対処:
1. オプション値から選択したか確認
2. テキスト入力時に特殊文字をエスケープ
3. パラメータを URL エンコードしているか確認
```

---

**作成日**: 2026年2月18日  
**参考実装**: C:\ibi\apps\rest\index.js (runCustomReport 関数)  
**WebFOCUS バージョン**: 9.3.0 以上
