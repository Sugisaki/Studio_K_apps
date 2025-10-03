#!/bin/bash
set -e  # スクリプト全体でエラーがあれば即終了

# ビルド
source ./build.sh

# サーバー起動
npx http-server || handle_error "http-server の起動に失敗しました"

