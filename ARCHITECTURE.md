# アーキテクチャ設計書

このドキュメントは「生産密度チャレンジ」のシステム設計と技術的な構造について説明します。

## 🏗️ システム概要

### アーキテクチャパターン
- **MVC (Model-View-Controller)** パターンを採用
- **モジュラーモノリス**: 単一アプリケーション内でのモジュール分割
- **イベント駆動**: ユーザー操作とゲームループによる状態更新

### 技術スタック
```
Frontend: HTML5 Canvas + Vanilla JavaScript (ES6+)
Testing: 独自テストフレームワーク
Build: なし（ブラウザネイティブES6モジュール）
Deploy: GitHub Pages
```

## 📁 ディレクトリ構造

```
factory-game/
├── src/                    # ソースコード
│   ├── config.js          # 設定・定数
│   ├── terrain.js         # 地形生成（Model）
│   ├── buildings.js       # 建物管理（Model）
│   ├── items.js          # アイテム管理（Model）
│   ├── renderer.js       # 描画処理（View）
│   ├── game.js           # ゲーム制御（Controller）
│   └── main.js           # エントリーポイント
├── tests/                 # テストコード
│   ├── test-framework.js  # テストフレームワーク
│   ├── *.test.js         # 各モジュールのテスト
│   └── run-tests.js      # テスト実行
├── docs/                  # ドキュメント（将来）
├── assets/               # 静的ファイル（将来）
├── index.html            # メインHTML
├── test.html             # テスト実行HTML
├── hero-image.svg        # キービジュアル
├── style.css             # スタイルシート
└── package.json          # プロジェクト設定
```

## 🧩 モジュール設計

### 1. Config Module (`src/config.js`)
**責任**: ゲーム全体の設定と定数管理

```javascript
// 設定の種類
- GAME_CONFIG: ゲーム基本設定
- BUILDING_TYPES: 建物タイプ定義
- TERRAIN_TYPES: 地形タイプ定義
- BUILDING_DISPLAY: 表示設定
```

**設計原則**:
- 全ての定数を一箇所で管理
- 型安全性の確保
- 設定変更の影響範囲を明確化

### 2. Terrain Module (`src/terrain.js`)
**責任**: 地形の生成と管理

```javascript
class TerrainGenerator {
    static generateTerrain(oreChance)    // 地形生成
    static getTerrainAt(terrain, x, y)   // 地形取得
    static countOreAreas(terrain)        // 鉱石数カウント
}
```

**設計原則**:
- 静的メソッドによる純粋関数
- 副作用のない設計
- テスタビリティの確保

### 3. Buildings Module (`src/buildings.js`)
**責任**: 建物の設置・削除・管理

```javascript
class BuildingManager {
    placeBuilding(x, y, type, terrain)   // 建物設置
    removeBuilding(x, y)                 // 建物削除
    getBuildingAt(x, y)                  // 建物取得
    getBuildingCount(type)               // 建物数取得
}
```

**設計原則**:
- 建物の状態管理を一元化
- 設置制約の検証
- 効率的な検索・更新

### 4. Items Module (`src/items.js`)
**責任**: アイテムの生成・移動・回収

```javascript
class ItemManager {
    addItem(x, y, type)                  // アイテム追加
    moveItems(buildingManager)           // アイテム移動
    getTotalItemCount()                  // アイテム数取得
    getItemsOnBelts(buildingManager)     // ベルト上アイテム数
}
```

**設計原則**:
- 複雑な移動ロジックの封じ込め
- 建物との連携
- パフォーマンスを考慮した実装

### 5. Renderer Module (`src/renderer.js`)
**責任**: Canvas描画処理

```javascript
class Renderer {
    renderTerrain(terrain)               // 地形描画
    renderBuildings(buildings)           // 建物描画
    renderItems(items)                   // アイテム描画
    renderHints(...)                     // ヒント描画
}
```

**設計原則**:
- 描画ロジックの分離
- 再利用可能な描画メソッド
- パフォーマンス最適化

### 6. EfficiencyChart Module (`src/efficiency-chart.js`)
**責任**: 生産密度効率のリアルタイムグラフ描画

```javascript
class EfficiencyChart {
    updateChart(efficiency)              // グラフ更新
    clearChart()                         // グラフクリア
    drawGrid()                           // グリッド描画
    drawData()                           // データ線描画
}
```

**設計原則**:
- 5分間の履歴データ管理
- 動的なスケーリング
- 滑らかなアニメーション

### 7. Game Module (`src/game.js`)
**責任**: ゲーム全体の制御とオーケストレーション

```javascript
class Game {
    update()                             // ゲーム状態更新
    render()                             // 描画実行
    handleClick(e)                       // ユーザー操作処理
    gameLoop()                           // メインループ
}
```

**設計原則**:
- 各モジュールの協調
- ユーザー操作の処理
- ゲームループの管理

## 🔄 データフロー

### 1. 初期化フロー
```
main.js → Game constructor → 各Manager初期化 → Renderer初期化
```

### 2. ユーザー操作フロー
```
User Click → Game.handleClick → BuildingManager.placeBuilding → 状態更新
```

### 3. ゲームループフロー
```
Game.gameLoop → Game.update → Game.render → requestAnimationFrame
```

### 4. アイテム移動フロー
```
Game.update → ItemManager.moveItems → BuildingManager参照 → 状態更新
```

## 🗄️ データ構造

### 地形データ
```javascript
terrain: Array<Array<string>>
// terrain[y][x] = 'grass' | 'iron_ore' | 'copper_ore' | 'coal'
```

### 建物データ
```javascript
buildings: Map<string, Building>
// key: "x,y", value: { type, x, y, timer }
```

### アイテムデータ
```javascript
items: Map<string, Array<Item>>
// key: "x,y", value: [{ type, x, y, createdTime }]
```

### 生産密度システム
```javascript
// 稼働効率 = (稼働中の採掘機数 × 稼働中の製錬炉数) ÷ 総建物数
operatingEfficiency = (activeMinerCount * activeSmelterCount) / totalBuildings;

// 生産密度スコア = 総金属板生産量 × 稼働効率
productionDensityScore = totalMetalProduction * operatingEfficiency;
```

## ⚡ パフォーマンス設計

### 最適化戦略
1. **効率的なデータ構造**: Map使用による高速検索
2. **フレーム制御**: アイテム移動の間隔調整
3. **描画最適化**: 必要な部分のみ再描画（将来実装）
4. **メモリ管理**: 不要なオブジェクトの適切な削除

### 計算量
- **建物検索**: O(1) - Map使用
- **アイテム移動**: O(n) - nはアイテム数
- **描画**: O(m) - mは表示オブジェクト数

## 🧪 テスト設計

### テスト戦略
```
Unit Tests: 各モジュールの単体テスト
Integration Tests: モジュール間連携テスト
E2E Tests: ユーザーシナリオテスト（将来）
```

### テストカバレッジ
- **TerrainGenerator**: 100%
- **BuildingManager**: 100%
- **ItemManager**: 100%
- **Renderer**: 部分的（将来改善）
- **Game**: 部分的（将来改善）

## 🔮 拡張性設計

### 新機能追加パターン

#### 1. 新しい建物タイプ
```javascript
// 1. config.jsに定数追加
BUILDING_TYPES.FURNACE = 'furnace';

// 2. BuildingManagerに制約ロジック追加
// 3. Rendererに描画ロジック追加
// 4. テスト追加
```

#### 2. 新しい資源タイプ
```javascript
// 1. アイテムタイプ定義追加
// 2. ItemManagerに処理ロジック追加
// 3. 描画設定追加
// 4. テスト追加
```

#### 3. 新しいゲームメカニクス
```javascript
// 1. 新しいManagerクラス作成
// 2. Gameクラスに統合
// 3. 必要に応じてRendererに描画追加
// 4. 包括的なテスト追加
```

#### 4. 資源配置アルゴリズム
```javascript
// クラスター配置による公平な資源分布
// 固定数: 鉄鉱石 25個、銅鉱石 20個、石炭 15個
// 1. クラスター中心をランダムに配置
// 2. 中心から広がるように資源を配置
// 3. 各資源タイプごとに固定数を保証
```

### プラグイン設計（将来）
```javascript
// プラグインインターフェース例
interface GamePlugin {
    initialize(game: Game): void;
    update(deltaTime: number): void;
    render(renderer: Renderer): void;
}
```

## 🔒 制約と制限

### 現在の制約
- **ブラウザ依存**: ES6モジュール対応ブラウザのみ
- **シングルプレイヤー**: マルチプレイヤー非対応
- **メモリ制限**: 大規模マップ非対応
- **部分的な永続化**: ベストスコアのみLocalStorageで保存

### 技術的負債
- **Rendererのテスト不足**: Canvas描画のテスト困難
- **グローバル状態**: 一部のゲーム状態がGame内に集中
- **エラーハンドリング**: 包括的なエラー処理が不足

## 🚀 将来の改善計画

### Phase 1: 基盤強化
- [ ] Rendererのテスト改善
- [ ] エラーハンドリング強化
- [ ] パフォーマンス監視追加

### Phase 2: 機能拡張
- [ ] セーブ・ロード機能
- [ ] 新しい建物・資源
- [ ] 統計・実績システム

### Phase 3: 高度な機能
- [ ] マルチプレイヤー対応
- [ ] プラグインシステム
- [ ] 3D描画対応

---

このアーキテクチャは継続的に進化させていきます。
設計変更や改善提案があれば、GitHub Issuesでお知らせください。
