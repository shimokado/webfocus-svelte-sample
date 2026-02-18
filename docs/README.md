# WebFOCUS Svelte Sample - ドキュメント索引

このフォルダには、WebFOCUS REST API を Svelte で実装する際に必要な技術知識をまとめた資料を保管しています。

## REST API サンプルページ

ログイン後に WebFOCUS REST API のテストページを開く手順:

1. ログイン

```
http://localhost/ibi_apps/rs?IBIRS_action=signOn&IBIRS_userName=admin&IBIRS_password=admin&IBIRS_service=ibfs
```

2. テストページを開く

```
http://localhost/ibi_apps/rs?IBIRS_action=TEST
```

## WebFOCUS セキュリティ設定の注意点

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

## 📚 ドキュメント一覧と用途

### 1️⃣ [01_REST_API_GUIDE.md](01_REST_API_GUIDE.md) - REST API 基礎
**対象読者**: Web API 初心者  
**読むタイミング**: 最初に読むべき基礎ドキュメント

**内容**:
- WebFOCUS REST API の基本的な使い方
- HTTP メソッド（POST/GET）の使い分け
- XML レスポンスの解析パターン 4 つ
- CSRF トークンの管理方法
- セッション管理とエラーコード

**学習目標**:
- REST API とは何かを理解
- `/ibi_apps/rs` エンドポイントの基本パラメータを習得
- XML 解析の基本パターンを習得

---

### 2️⃣ [02_IBFS_GUIDE.md](02_IBFS_GUIDE.md) - WebFOCUS ファイルシステム
**対象読者**: WebFOCUS の フォルダ構造 / リポジトリ について学びたい方  
**読むタイミング**: 01 の後、レポート一覧機能を実装する前

**内容**:
- IBFS（IBI ファイルシステム）の概念
- ディレクトリー階層構造（`IBFS:/WFC/Repository`, `IBFS:/SSYS/USERS` など）
- パス操作（URL エンコード、親パス取得など）
- リソースタイプ（Folder, FexFile, etc）
- 実装例 5 つ（フォルダナビゲーション、パンくずリスト、など）

**学習目標**:
- IBFS パスの構造を理解
- パス操作を実装できるようになる
- フォルダ階層ナビゲーションを実装できる

---

### 3️⃣ [03_DESCRIBE_FEX_GUIDE.md](03_DESCRIBE_FEX_GUIDE.md) - パラメータ抽出 API
**対象読者**: レポート実行機能を実装する開発者  
**読むタイミング**: 02 の後、カスタムレポート実行機能を実装するとき

**内容**:
- `describeFex` API の完全な仕様
- パラメータ定義の XML 構造
- パラメータ抽出ロジック（step-by-step）
- SELECT vs TEXT 判定方法
- 完全な実装例（Vanilla JS コード）
- エラーハンドリングチェックリスト

**学習目標**:
- 報告書（.fex）のパラメータを動的に取得できる
- パラメータ入力フォームを生成できる
- カスタム実行機能を実装できる

---

### 4️⃣ [04_BEST_PRACTICES.md](04_BEST_PRACTICES.md) - 実装ベストプラクティス
**対象読者**: Vanilla JS 参考実装 (`C:\ibi\apps\rest\index.js`) の設計を学びたい方  
**読むタイミング**: 3 つのドキュメント呼んだ後、全体設計を改善したいとき

**内容**:
- エラーハンドリングの 3 層設計
- XML 解析の推奨パターン
- セキュリティ実装（HTML エスケープ、URL エンコード）
- UI レンダリング効率化
- コード構成と責務分離
- パフォーマンス最適化
- テスト容易性設計

**学習目標**:
- 堅牢で保守性高いコードが書ける
- セキュリティ脆弱性を避けられる
- 他の開発者が読むコードを設計できる

---

### 5️⃣ [05_SVELTE_PATTERNS.md](05_SVELTE_PATTERNS.md) - Svelte 適応実装
**対象読者**: Vanilla JS 設計を Svelte で実装したい開発者  
**読むタイミング**: 本プロジェクト実装時

**内容**:
- API モジュール設計（Svelte での分離パターン）
- コンポーネント構成（Vanilla JS との対応表）
- Svelte Stores による状態管理
- リアクティビティの活用
- エラー表示パターン
- テスト戦略
- 参考実装との完全なマッピング表

**学習目標**:
- Svelte で API を適切に呼び出せる
- Stores で複数コンポーネント間の状態を管理できる
- Svelte のリアクティブ機能を活用できる

---

### 6️⃣ [06_TROUBLESHOOTING.md](06_TROUBLESHOOTING.md) - トラブルシューティング
**対象読者**: 問題を解決したい全員  
**読むタイミング**: エラーまたは予期しない挙動に遭遇したとき

**内容**:
- ビルド・実行時エラー（EADDRINUSE など）
- ログインエラーと診断方法
- API 通信エラー・CORS 問題
- XML 解析エラーの原因と対処
- セッション・認証トラブル
- UI 表示問題
- デバッグテクニック（DevTools 使い方）
- よくあるミス チェックリスト

**学習目標**:
- エラーログからの診断ができる
- Chrome DevTools を活用できる
- よくあるミスを事前に回避できる

---

### 7️⃣ [07_SYSTEM_DESIGN.md](07_SYSTEM_DESIGN.md) - 実装設計書
**対象読者**: 実装方針と構成を把握したい開発者
**読むタイミング**: 実装前の全体確認、引き継ぎ時

**内容**:
- コンポーネント/ストア/API の設計
- `IBIRS_action` ごとのメソッド管理
- デプロイ配置と approot アクセス
- E2E テスト方針

**学習目標**:
- 実装の意図と構成を説明できる
- 変更時の影響範囲が把握できる

---

## 🎯 用途別読む順序

### 🆕 WebFOCUS REST API が初めての方

```
01_REST_API_GUIDE.md
   ↓
02_IBFS_GUIDE.md
   ↓
03_DESCRIBE_FEX_GUIDE.md
   ↓
06_TROUBLESHOOTING.md（参照用）
```

### 🔧 本プロジェクトの実装を進める方

```
04_BEST_PRACTICES.md（設計を理解）
   ↓
05_SVELTE_PATTERNS.md（実装パターンを習得）
   ↓
01-03_GUIDE.md（必要に応じて参照）
   ↓
06_TROUBLESHOOTING.md（問題発生時）
```

### 🐛 エラーが発生した方

```
06_TROUBLESHOOTING.md（エラータイプを特定）
   ↓
関連ドキュメント（01-05）を参照
```

### 📖 学習順序（推奨）

```
開発環境の準備
   ↓
01_REST_API_GUIDE.md - REST API の基本を理解
   ↓
02_IBFS_GUIDE.md - WebFOCUS のファイルシステムを理解
   ↓
03_DESCRIBE_FEX_GUIDE.md - パラメータ抽出機能を理解
   ↓
04_BEST_PRACTICES.md - パターンと設計を学ぶ
   ↓
05_SVELTE_PATTERNS.md - Svelte での実装方法を学ぶ
   ↓
実装開始（必要に応じて 06 を参照）
```

---

## 📋 クイックリファレンス

### よく検索される内容

| 内容 | ドキュメント |
|-----|-----------|
| signOn API の使い方 | 01_REST_API_GUIDE.md |
| CSRF トークン の取得 | 01_REST_API_GUIDE.md + 04_BEST_PRACTICES.md |
| フォルダ一覧の取得 | 02_IBFS_GUIDE.md |
| パス の URL エンコード | 02_IBFS_GUIDE.md |
| パラメータ抽出 | 03_DESCRIBE_FEX_GUIDE.md |
| SELECT / TEXT の判別 | 03_DESCRIBE_FEX_GUIDE.md |
| エラーハンドリング | 04_BEST_PRACTICES.md |
| HTML エスケープ | 04_BEST_PRACTICES.md |
| Stores による状態管理 | 05_SVELTE_PATTERNS.md |
| API モジュール設計 | 05_SVELTE_PATTERNS.md |
| ログインエラー  の対処 | 06_TROUBLESHOOTING.md |
| XML パースエラー の解決 | 06_TROUBLESHOOTING.md |
| CORS エラー の対処 | 06_TROUBLESHOOTING.md |

---

## 🔗 関連ドキュメント（プロジェクト全体）

プロジェクトのドキュメント全体構成:

```
c:\dev\webfocus-svelte-sample/
├── README.md（プロジェクト全体説明）
├── DEVELOPMENT.md（開発ガイド）
├── API_REFERENCE.md（Svelte API リファレンス）
├── DEPLOYMENT.md（デプロイメント手順）
├── PROJECT_SUMMARY.md（プロジェクト概要）
│
└── docs/（このフォルダ）
    ├── 01_REST_API_GUIDE.md
    ├── 02_IBFS_GUIDE.md
    ├── 03_DESCRIBE_FEX_GUIDE.md
    ├── 04_BEST_PRACTICES.md
    ├── 05_SVELTE_PATTERNS.md
    ├── 06_TROUBLESHOOTING.md
    └── README.md（このファイル）
```

## 🎓 学習パス

### Level 1: 基礎（1 週間）
- 01_REST_API_GUIDE.md をすべて読む
- API ドキュメント内の例を手動でテスト
- パースエラーの 3 層設計を理解

### Level 2: 中級（2 週間）
- 02_IBFS_GUIDE.md, 03_DESCRIBE_FEX_GUIDE.md を読む
- 各実装例をコピー & 改良
- 簡単なレポート一覧機能を作成

### Level 3: 上級（3 週間）
- 04_BEST_PRACTICES.md でセキュリティと設計を学ぶ
- 05_SVELTE_PATTERNS.md で Svelte パターンを習得
- 本プロジェクトの実装を完成

### Level 4: エキスパート（4 週間+）
- 本番環境でのトラブルシューティング（06_TROUBLESHOOTING.md）
- セッション管理の高度なパターン
- 複雑なレポート実行シナリオの実装

---

## 📞 参考資料へのリンク

- [WebFOCUS REST API 公式ドキュメント]()
- [Svelte 公式ドキュメント](https://svelte.dev/docs)
- [Vite ドキュメント](https://vitejs.dev/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/)
- [MDN Web Docs - Fetch API](https://developer.mozilla.org/ja/docs/Web/API/Fetch_API)
- [MDN Web Docs - DOMParser](https://developer.mozilla.org/ja/docs/Web/API/DOMParser)

---

## 💡 ドキュメント利用のヒント

### 1. 全文検索を使う
```bash
# VS Code で Ctrl+Shift+F を押して
# "CSRF" "XML" "エラー" など検索

# または grep コマンド
findstr /N "CSRF" *.md
```

### 2. 関連セクションへのジャンプ
各ドキュメントは **目次** にリンクがあります。
内容を目次から探すと高速です。

### 3. サンプルコードのコピー
```javascript
// ❌ コードをそのままコピペするのではなく
// ✅ 自分のプロジェクトに合わせて調整してから使用
```

### 4. 異なるドキュメント間の関連性を把握
各セクションに **関連ドキュメント** への参照が記載されています。

---

## 🚀 はじめに

1. **初めて見た**, または **REST API が初めて** な場合
   → まず [01_REST_API_GUIDE.md](01_REST_API_GUIDE.md) を読む

2. **本プロジェクトを実装** している
   → [05_SVELTE_PATTERNS.md](05_SVELTE_PATTERNS.md) から始める

3. **エラーが発生** した
   → [06_TROUBLESHOOTING.md](06_TROUBLESHOOTING.md) で検索

4. **全体的な設計** を学びたい
   → [04_BEST_PRACTICES.md](04_BEST_PRACTICES.md) で学ぶ

---

**最終更新**: 2026年2月18日  
**バージョン**: 1.0  
**著者**: GitHub Copilot  
**対象読者**: WebFOCUS 開発者・Svelte 初心者

---

## 📝 ドキュメント改善への提案

このドキュメントに不明な点や改善提案がある場合は、各ドキュメントの最後にある **参考資料** セクションを確認するか、参考実装（`C:\ibi\apps\rest\index.js`）を直接参照してください。
