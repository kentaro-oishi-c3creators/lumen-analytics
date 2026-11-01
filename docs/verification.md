# 検証結果

2026年11月1日（日本時間）に実施。

- TypeScript + Viteの本番ビルド：成功。
- 自動テスト8件：成功。全フィルター組み合わせの集計整合、残高の期間末処理、OEE、加重平均、API認証・Origin・入力・回数制限・上流エラーを確認。
- Chromiumの実操作：4業種のフィルター、KPI変化、カテゴリー明細、ビュー保存・復元、CSVの全内容を検証。CSVはフィルター後の元データと完全一致。
- AIデモ：スライダー変更が売上・利益・回答の前提へ反映されること、日本語の質問、未対応質問の扱い、危険な接続URLの拒否を確認。
- 390px幅：メニュー移動、金融画面・AI画面の表示、横方向のページはみ出しがないことを確認。
- コレクション：5件のサンプル画面とサムネイル読み込みを確認。
- 紹介スライド：10枚のSVG読み込み、左右矢印・Home・End・サムネイル移動を確認。PDFも生成。
- 紹介スライドの図解リンクから、条件付きのダッシュボード・明細を開く操作を確認。
- 本番ビルドを `/lumen-analytics/` 配下で配信して6画面を確認。フォント・画像・SVGのHTTPエラー0件。実際のPages公開結果は下記に記録。
- ブラウザのページ例外：0件。
- ブラウザ → CORS付きのローカルAPI → 生成関数 → 回答表示をモックで検証。認証失敗の画面表示と、トークンをlocalStorageに残さないことも確認。詳細は `api-browser-verification.json`。
- Claudeライブ呼び出し：APIキー未提供のため未実施。プロバイダー生成関数のモックを使用してAPIの受け渡しを検証。
- GitHub配置：`kentaro-oishi-c3creators/lumen-analytics` のmainへ配置済み。最初のREADMEのコミットを親として履歴を保持。
- GitHub Actions：初回実行（run 41292002327）で依存導入・8件のテスト・型チェック・本番ビルドが成功。
- Pages公開：SourceをGitHub Actionsへ変更後、run `41292251863` のattempt 2でbuild・deployともに成功。公開コードのコミットは `99c00203d03a3d5c28d56b07f512efb64e3b82ae`。
- 公開成功時刻：2026年11月1日 18:17（日本時間）。デプロイログが返したURL： https://kentaro-oishi-c3creators.github.io/lumen-analytics/
- 公開の確認はGitHub Pagesのデプロイ成功結果による。公開先URLをブラウザで再操作する検証は行っていない（操作・撮影はローカルの本番相当サイトで実施）。

実行コマンド・詳細結果は `browser-verification.json` / `presentation-verification.json` に記録。
