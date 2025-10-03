# Studio_K_apps - GPX Viewer Project

## 📁 プロジェクト構成

```
Studio_K_apps/
├── gpx-viewer-react/           # React アプリケーションのソースコード
│   ├── src/
│   │   ├── App.tsx            # メインアプリケーション
│   │   ├── main.tsx           # React アプリケーションのエントリーポイント
│   │   ├── App.css            # アプリケーションスタイル
│   │   ├── index.css          # グローバルスタイル、カスタムコンポーネントスタイル
│   │   └── components/        # UIコンポーネント群
│   │       ├── Statistics.tsx      # 統計情報表示コンポーネント
│   │       ├── MapComponent.tsx    # 地図表示コンポーネント（Leaflet）
│   │       ├── ChartComponent.tsx  # グラフ表示コンポーネント（Chart.js）
│   │       ├── TimelineScrubber.tsx # タイムライン操作コンポーネント
│   │       └── EditControls.tsx    # 編集ツールコンポーネント
│   ├── public/                # 静的ファイル
│   ├── dist/                  # ビルド済みファイル（npm run build後に生成）
│   ├── package.json           # 依存関係とスクリプト定義
│   ├── vite.config.ts         # Vite設定ファイル
│   ├── tsconfig.json          # TypeScript設定
│   ├── tsconfig.app.json      # アプリケーション用TypeScript設定
│   ├── tsconfig.node.json     # Node.js用TypeScript設定
│   └── eslint.config.js       # ESLint設定
├── assets/                    # ビルド済みアセットファイル（CSS, JS）
├── index.html                 # ランディングページ（Studio Kアプリ一覧）
├── gpx-viewer.html.template   # GPXビューのテンプレート（説明文など）
├── gpx-viewer.html            # ビルド済みGPXビューアアプリ
├── install_packages.sh        # 依存関係インストールスクリプト
├── build.sh                   # ビルドスクリプト
├── build_and_http.sh          # ビルド＆HTTPサーバー起動スクリプト
├── README.md                  # プロジェクト概要
└── AGENTS.md                  # このファイル（詳細仕様書）
```

## 🎯 機能仕様

### 主要機能
1. **GPXファイル解析**
   - ローカルファイル選択によるGPXファイル読み込み
   - GPXパーサーによる軌跡データ抽出（トラックデータ・ルートデータ対応）
   - プライバシー重視（サーバーアップロード無し）
   - **トラックデータ**: 時間情報を持つGPS軌跡データ
   - **ルートデータ**: 時間情報を持たない計画ルートデータ

2. **地図表示**
   - OpenStreetMapを使用したインタラクティブ地図
   - GPX軌跡の赤線表示
   - アクティブポイントのマーカー表示
   - 自動ズーム・フィット機能

3. **統計情報**
   - 総距離計算（ハーバーサイン公式使用）
   - 累積上昇・下降計算
   - 最低・最高標高表示
   - リアルタイム更新
   - **移動中央値による平滑化**: ノイズ除去で正確な統計値

4. **インタラクティブグラフ**
   - 標高プロファイル表示（移動中央値による平滑化）
   - 速度プロファイル表示（トラックデータの場合、移動中央値計算）
   - **横軸自動切替**: トラックデータは時間軸、ルートデータは距離軸
   - ラジオボタンによる標高・速度切替
   - クリックによるポイント選択

5. **タイムライン操作**
   - ドラッグ可能なスクラバー（マウス・タッチ対応）
   - 範囲選択機能
   - 現在位置マーカー
   - PC・スマートフォン対応（タッチイベント完全対応）

6. **編集機能**
   - 選択範囲の切り出し
   - 選択範囲の削除
   - リセット機能

### データ処理アルゴリズム

#### 移動中央値による平滑化
1. **速度計算（トラックデータ）**
   - **窓枠**: 15秒の時間窓
   - **方法**: 窓内の連続ポイント間で瞬間速度を計算し、中央値を算出
   - **効果**: GPS位置ばらつきによる速度異常値を抑制

2. **標高平滑化（ルートデータ）**
   - **窓枠**: 25mの距離窓
   - **方法**: 窓内の標高値の中央値を算出
   - **効果**: 標高データのノイズ除去と滑らかなプロファイル

#### GPXデータ形式対応
- **トラックデータ優先**: 両方存在する場合はトラックデータを使用
- **自動判定**: データ形式に応じて処理方法を自動切替
- **距離計算**: ハーバーサイン公式による正確な地球上距離計算

### クロスプラットフォーム対応
- **デスクトップ**: マウス操作サポート
- **モバイル**: タッチ操作サポート（`touchstart`, `touchmove`, `touchend`）
- **ブラウザ互換性**: Chrome, Firefox, Safari, Edge
- **Firefox対応**: CSS優先度とタッチイベント互換性を考慮

## 🛠️ 使用技術

### フロントエンド
- **React 18.3.1**: UIライブラリ
- **TypeScript 5.2.2**: 型安全な開発
- **Vite 5.3.1**: 高速ビルドツール・開発サーバー

### UI・スタイリング
- **Bootstrap 5.3.3**: レスポンシブUIフレームワーク
- **CSS**: カスタムスタイリング

### 地図・可視化
- **Leaflet 1.9.4**: 軽量地図ライブラリ
- **React-Leaflet 4.2.1**: React用Leafletラッパー
- **Chart.js 4.4.3**: グラフ描画ライブラリ
- **React-ChartJS-2 5.2.0**: React用Chart.jsラッパー
- **chartjs-adapter-date-fns 3.0.0**: 日時軸サポート

### データ処理
- **GPXParser 3.0.8**: GPXファイル解析ライブラリ

### 開発ツール
- **ESLint**: コード品質チェック
- **TypeScript ESLint**: TypeScript用リンター
- **Vite Plugin React**: React開発サポート

### 地図データ
- **OpenStreetMap**: オープンソース地図タイル

## 🚀 ビルド方法

### 1. 依存関係インストール
```bash
# 自動インストールスクリプト使用
./install_packages.sh

# または手動で
cd gpx-viewer-react
npm install
```

### 2. 開発サーバー起動
```bash
cd gpx-viewer-react
npm run dev
# → http://localhost:5173 で開発サーバー起動
```

### 3. プロダクションビルド
```bash
# 自動ビルド＆サーバー起動
./build_and_http.sh

# または手動で
cd gpx-viewer-react
npm run build
cp dist/index.html ../gpx-viewer.html
cp -r dist/assets ../
npx http-server
```

### 4. その他のスクリプト
```bash
cd gpx-viewer-react

# 型チェック
npm run build  # TypeScriptコンパイル + Viteビルド

# コード品質チェック
npm run lint

# プレビュー（ビルド済みファイル確認）
npm run preview
```

## 📋 開発時の注意事項

### ファイル構成ルール
- **コンポーネント**: `src/components/` 配下に配置
- **型定義**: 各コンポーネント内で定義、共通型は `App.tsx` にエクスポート
- **スタイル**: グローバルスタイルは `index.css`、コンポーネント固有は各ファイル

### ブラウザ互換性対応
- **Firefox**: CSS優先度の違いに注意
- **スマートフォン**: タッチイベント必須
- **Safari**: ベンダープレフィックス考慮

### パフォーマンス最適化
- **大きなGPXファイル**: メモリ使用量に注意
- **リアルタイム更新**: useCallback, useMemoの適切な使用
- **地図レンダリング**: ポイント数制限の検討

### セキュリティ・プライバシー
- **ローカル処理**: GPXファイルはブラウザ内でのみ処理
- **外部通信**: 地図タイル取得のみ
- **データ保存**: ローカルストレージ使用なし

## 🔧 カスタマイズポイント

### 地図プロバイダー変更
`MapComponent.tsx` の TileLayer URL を変更:
```tsx
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  // 他のプロバイダーのURLに変更可能
/>
```

### 統計計算アルゴリズム
`Statistics.tsx` のハーバーサイン公式や標高計算をカスタマイズ可能

### UI テーマ
`index.css` でBootstrapテーマやカスタムカラーを変更可能

### チャート設定
`ChartComponent.tsx` でChart.jsの詳細設定をカスタマイズ可能

## 📊 技術的な特徴

### 型安全性
- TypeScriptによる厳密な型定義
- コンポーネント間のprops型チェック
- GPXデータ構造の型安全な処理

### リアクティブ設計
- useState/useEffectによる状態管理
- コンポーネント間の双方向データバインディング
- パフォーマンス最適化されたリレンダリング

### モジュラー構成
- 再利用可能なコンポーネント設計
- 責任分離の原則に基づく構成
- 将来の機能拡張に対応した設計

このプロジェクトは、GPSデータの可視化と分析のための包括的なWebアプリケーションとして設計されており、プライバシーを重視しながら豊富な機能を提供します。
