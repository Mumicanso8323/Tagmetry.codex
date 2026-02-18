--- a/docs/README.ja.md
+++ b/docs/README.ja.md
@@ -0,0 +1,20 @@
+# Tagmetry
+
+## 概要
+Tagmetry（タグメトリー）は、Stable Diffusionクリエイター向けのデータセットインテリジェンスおよびLoRA最適化ツールキットです。
+
+## クイックスタート
+### デバッグ実行
+1. リポジトリのルートで `tool.bat debug` を実行します。
+2. Webホストが起動したら、ブラウザで `http://127.0.0.1:<port>/` を開きます。
+3. 使用中のリッスンURL（ポート番号を含む）は、コンソールの起動ログと `log/web.log` に出力されます。
+
+## 公開
+1. リポジトリのルートで `tool.bat publish` を実行します。
+2. 単一ファイルのビルド成果物は `dist/web` に出力されます。
+
+## ログ
+- `log/bootstrap.log`: 起動・ブートストラップおよび致命的なクラッシュのブレッドクラムを記録します。
+- `log/web.log`: 通常の ASP.NET Core とアプリケーション実行ログを記録します。