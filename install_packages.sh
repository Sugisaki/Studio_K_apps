#!/bin/bash

# エラー処理関数
fail_if_error() {
  if [ $? -ne 0 ]; then
    echo "❌ エラー: $1"
    exit 1
  fi
}

echo "📁 gpx-viewer-react ディレクトリに移動中..."
cd gpx-viewer-react
fail_if_error "gpx-viewer-react に移動できませんでした"

echo "🧹 node_modules を削除中..."
rm -rf node_modules
fail_if_error "node_modules の削除に失敗しました"

echo "🧹 package-lock.json を削除中..."
rm package-lock.json
fail_if_error "package-lock.json の削除に失敗しました"

echo "📦 npm install 実行中目..."
npm install
fail_if_error "npm install に失敗しました"

echo "🔙 親ディレクトリに戻ります..."
cd ..
fail_if_error "親ディレクトリに戻れませんでした"

