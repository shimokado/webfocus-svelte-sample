# プロジェクト運用ガイド

このファイルは、本リポジトリで作業するコントリビューター向けのプロジェクト固有ルールをまとめたものです。

## クイックリンク

- プロジェクト概要: README.md
- クイックスタート: QUICK_START.md
- 技術ドキュメント索引: docs/README.md
- 推奨 Skills 構成: .github/skills.md
- Copilot ルート指示: .github/copilot-instructions.md
- 追加 instruction: .github/instructions/
- 再利用 prompt: .github/prompts/
- カスタム chatmode: .github/chatmodes/
- カスタム agent: .github/agents/
- プロジェクト skill: .github/skills/

## 開発の基本

- 依存関係のインストール: npm install
- 開発サーバー起動: npm run dev
- ビルド: npm run build

## 参照ドキュメント

- WebFOCUS REST API: docs/01_REST_API_GUIDE.md
- IBFS パスの扱い: docs/02_IBFS_GUIDE.md
- describeFex パラメータ処理: docs/03_DESCRIBE_FEX_GUIDE.md
- ベストプラクティス / Svelte パターン: docs/04_BEST_PRACTICES.md, docs/05_SVELTE_PATTERNS.md
- トラブルシューティング: docs/06_TROUBLESHOOTING.md

## 調査・検証のヒント

- REST API テストページの確認手順:
	1) サインイン: http://localhost/ibi_apps/rs?IBIRS_action=signOn&IBIRS_userName=admin&IBIRS_password=admin&IBIRS_service=ibfs
	2) テストページを開く: http://localhost/ibi_apps/rs?IBIRS_action=TEST
- ユーザーの依頼がある場合、GitHub Copilot は MCP ツール経由で Chrome を起動し、ブラウザ上の実レスポンスを確認できます。

## context7 / awesome-copilot 利用方針

- `context7` は、仕様確認・既存実装の理解・関連ファイル探索など、作業前のコンテキスト収集に活用します。
- `awesome-copilot` は、再利用可能な指示・エージェント・プロンプトを検索 / 読み込みし、実装方針や手順の標準化に活用します。
- まず `context7` で現状把握し、必要に応じて `awesome-copilot` の知見を取り込んでから実装に進むことを推奨します。

## デプロイ後のアクセス

- ビルドして c:\ibi\apps\svelte に配置した後、以下でアプリにアクセスします:
	http://localhost/approot/svelte/index.htm
- このアクセス経路は WebFOCUS の CORS 制約を回避でき、POST が必要な処理で必須です。
- 作業完了時は、可能な限り `npm run deploy` 後に上記 URL で動作確認します。

## 動作確認ポリシー（エージェント）

- 優先: MCP Chrome + DevTools を使い、実画面操作と REST API レスポンス（Network/Console）を確認する。
- 代替: E2E や再現性の高い回帰確認では MCP Playwright の利用を許可する。
- 自動判断の基準:
	- レスポンス実体の目視確認 / DevTools解析が必要 → MCP Chrome + DevTools
	- 複数シナリオの繰り返し確認 / 自動化重視 → MCP Playwright

## HTTP メソッド方針

- アクションが GET をサポートしている場合は GET を優先します。
- signOn は通常 POST ですが、このプロジェクトでは GET を使用します。
- アクションごとの GET / POST は src/api/webfocus.js の ACTION_METHODS（JSON マップ）で管理します。

## WebFOCUS セキュリティ設定メモ

- Admin Console の Security タブで、ゾーンごとのクロスオリジン挙動を制御します。
- Cross-Origin Settings:
	- Allow Embedding（iframe）
	- Allow Cross-Origin Resources Sharing（CORS）
	- Allowed Origins ホワイトリスト（scheme/host/port が必要）
- Authentication Options:
	- Host ヘッダー検証用の Allowed Host Names ホワイトリスト
- Security Zone（Default / Mobile / Portlet / Alternate）ごとに個別設定です。

参照: http://localhost/ibi_apps/ibi_help/Default.htm#securityAdmin/admin_console23.htm#Understa5
