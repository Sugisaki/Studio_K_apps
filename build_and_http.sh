#!/bin/bash
set -e  # スクリプト全体でエラーがあれば即終了

# エラー処理関数
handle_error() {
  echo "❌ エラーが発生しました: $1"
  exit 1
}

# ディレクトリ移動
cd gpx-viewer-react || handle_error "gpx-viewer-react ディレクトリに移動できません"

# ビルド
npm run build || handle_error "npm run build に失敗しました"

# index.html のコピー
cp dist/index.html ../gpx-viewer.html || handle_error "index.html のコピーに失敗しました"
cp -p dist/index.html ../gpx-viewer.html || handle_error "index.html の属性付きコピーに失敗しました"

# assets の削除とコピー
rm -rf ../assets || handle_error "assets ディレクトリの削除に失敗しました"
cp -rp dist/assets ../. || handle_error "assets のコピーに失敗しました"

# 元のディレクトリに戻る
cd .. || handle_error "親ディレクトリに戻れません"

# サーバー起動
npx http-server || handle_error "http-server の起動に失敗しました"

