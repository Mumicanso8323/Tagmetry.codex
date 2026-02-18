--- a/docs/README.en.md
+++ b/docs/README.en.md
@@ -0,0 +1,20 @@
+# Tagmetry
+
+## Overview
+Tagmetry is a dataset intelligence and LoRA optimization toolkit for Stable Diffusion creators.
+
+## Quick Start
+### Debug run
+1. Run `tool.bat debug` from the repository root.
+2. When the web host starts, open `http://127.0.0.1:<port>/` in your browser.
+3. The active listen URL (including the port) is written in the console startup output and `log/web.log`.
+
+## Publish
+1. Run `tool.bat publish` from the repository root.
+2. The single-file build output is written to `dist/web`.
+
+## Logs
+- `log/bootstrap.log`: startup/bootstrap and fatal crash breadcrumbs.
+- `log/web.log`: regular ASP.NET Core and application runtime logs.