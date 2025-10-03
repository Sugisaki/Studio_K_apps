#!/bin/bash
set -e

# エラー処理関数
handle_error() {
  echo "❌ エラーが発生しました: $1"
  exit 1
}

# ビルドの実行
echo "🏃 ビルドスクリプトを実行します..."
./build.sh

# http-server の起動
echo "🚀 HTTPサーバーを起動します..."
npx http-server || handle_error "http-server の起動に失敗しました"
