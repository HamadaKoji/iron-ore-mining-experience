# CLAUDE.md - AIアシスタント向けプロジェクト情報

## 🎮 プロジェクト概要
- **プロジェクト名**: 初めての鉄鉱石採掘体験 (factory-game)
- **概要**: Factorio風の工場シミュレーションゲーム
- **技術スタック**: Vanilla JavaScript (ES6), HTML5 Canvas
- **外部依存**: なし（Pure JavaScript実装）
- **アーキテクチャ**: MVCパターン

## 🏗️ プロジェクト構造
```
factory-game/
├── src/                    # ソースコード
│   ├── main.js            # エントリーポイント
│   ├── game.js            # ゲームコントローラー
│   ├── terrain.js         # 地形生成モデル
│   ├── buildings.js       # 建物管理モデル
│   ├── items.js           # アイテム管理モデル
│   ├── renderer.js        # 描画ビュー
│   └── config.js          # 設定定数
├── tests/                  # テストスイート
│   ├── test-framework.js  # カスタムテストフレームワーク
│   └── *.test.js          # 各種テスト
├── scripts/                # 開発ツール
│   └── coverage-check.js  # カバレッジ計測
├── index.html             # メインゲーム
├── test.html              # テストランナー
└── package.json           # プロジェクト設定
```

## 🚀 開発コマンド
```bash
# 開発サーバー起動
npm run dev
# または
npm start

# テスト実行
npm test

# カバレッジ確認
npm run coverage

# ブラウザでテスト
http://localhost:8000/test.html
```

## 🔒 重要な開発規約

### 1. デプロイメントポリシー
- **絶対に自動デプロイしない**
- プロジェクトオーナーの明確な指示があるまでデプロイ実行禁止
- mainブランチへのマージはオーナー承認後のみ
- **必ずPull Request経由でmainブランチにマージする**
  - 直接mainブランチへのpushは禁止
  - featureブランチを作成し、PR作成後にレビュー・承認を経てマージ

### 2. ドキュメント同期ルール
- **ゲームルール変更時は必ずGAME_SPECIFICATION.mdを同時更新**
- コードと仕様書の整合性を常に保つ
- 仕様書更新を後回しにしない

### 3. コーディング規約
```javascript
// 定数: UPPER_SNAKE_CASE
const BUILDING_TYPES = { MINER: 'miner' };

// クラス: PascalCase
class BuildingManager { }

// 関数・変数: camelCase
function placeBuilding() { }

// ファイル名: kebab-case.js
```

### 4. テスト方針
- 新機能には必ずテストを追加
- テストカバレッジ50%以上を維持（目標80%）
- テストファーストアプローチを推奨

### 5. コミットメッセージ
```
✨ feat: 新機能
🐛 fix: バグ修正
📚 docs: ドキュメント
♻️ refactor: リファクタリング
🧪 test: テスト
```

## 🎯 ゲーム仕様要点

### 資源システム
1. **鉄鉱石** (🔩) - 茶色エリアで採掘（固定25個）
2. **銅鉱石** (🟠) - オレンジエリアで採掘（固定20個）
3. **石炭** (⚫) - 黒エリアで採掘（固定15個）
   - 資源はクラスター状に配置される（公平性のため数は固定）

### 建物タイプ
- **採掘機** (⛏️): 資源エリアでのみ設置可、2秒ごとに資源生成
- **ベルト** (➡️): アイテム輸送、方向は4方向選択可能
- **製錬炉** (🔥): 鉱石と石炭から金属板を生産

### ゲーム目標
生産密度スコア（金属板生産量 × 稼働効率）を最大化する

## 📊 パフォーマンス指標
- 初期ロード時間: 3秒以内
- フレームレート: 60fps維持
- メモリ使用量: 50MB以内

## 🌐 デプロイ情報
- **GitHub Pages**: https://hamadakoji.github.io/iron-ore-mining-experience/
- **自動デプロイ**: mainブランチへのマージで更新（オーナー承認必須）

## ⚠️ 注意事項
1. ES6モジュールを使用（IEは非対応）
2. 外部ライブラリは使用しない方針
3. コメントは必要最小限に
4. 日本語UIメインで開発

## 🔧 トラブルシューティング
- **CORS エラー**: ローカルでは必ずHTTPサーバー経由で実行（`npm run dev`）
- **モジュールエラー**: ブラウザがES6モジュール対応か確認
- **描画問題**: Canvas要素のサイズとCSSサイズの一致を確認