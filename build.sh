#!/bin/bash
set -e

# エラー処理関数
handle_error() {
  echo "❌ エラーが発生しました: $1"
  exit 1
}

# --- Reactアプリのビルド ---
echo "🔄 gpx-viewer-react ディレクトリに移動します..."
cd gpx-viewer-react || handle_error "gpx-viewer-react ディレクトリに移動できませんでした"

echo "📦 Reactアプリケーションをビルドします..."
npm run build || handle_error "npm run build に失敗しました"

echo "🔍 ビルド成果物からスクリプトとスタイルのタグを抽出します..."
CSS_TAG=$(grep -o '<link rel="stylesheet"[^>]*>' dist/index.html | head -n 1)
# scriptタグは開始タグと終了タグの両方を含むように修正
JS_TAG=$(grep -o '<script[^>]*src="/assets/[^>]*">.*</script>' dist/index.html | head -n 1)


if [ -z "$CSS_TAG" ] || [ -z "$JS_TAG" ]; then
  handle_error "dist/index.html からCSSまたはJSのタグが見つかりませんでした"
fi

echo "  - CSSタグが見つかりました: $CSS_TAG"
echo "  - JSタグが見つかりました: $JS_TAG"

cd .. || handle_error "親ディレクトリに戻れませんでした"

# --- gpx-viewer.html の更新 ---
echo "💉 gpx-viewer.html にタグを挿入します..."
# テンプレートファイルをリセット
cp -p gpx-viewer.html.template gpx-viewer.html

# awk を使ってプレースホルダーを置換します。HTMLタグを安全に渡せます。
awk -v css="$CSS_TAG" -v js="$JS_TAG" '
{
  sub("<!--STYLES_HERE-->", css);
  sub("<!--SCRIPTS_HERE-->", js);
  print;
}' gpx-viewer.html > gpx-viewer.html.new && mv gpx-viewer.html.new gpx-viewer.html

if [ $? -ne 0 ]; then
    handle_error "gpx-viewer.html へのタグの挿入に失敗しました"
fi

# --- アセットのコピー ---
echo "🚚 アセットをコピーします..."
rm -rf assets || handle_error "古いassetsディレクトリの削除に失敗しました"
cp -rp gpx-viewer-react/dist/assets . || handle_error "新しいassetsのコピーに失敗しました"

echo "✅ ビルド完了。 gpx-viewer.html が更新されました。"