import { GAME_CONFIG, BUILDING_TYPES, RESOURCE_TYPES } from './config.js';
import { TerrainGenerator } from './terrain.js';
import { BuildingManager } from './buildings.js';
import { ItemManager } from './items.js';
import { Renderer } from './renderer.js';

/**
 * メインゲームクラス
 */
export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.selectedTool = BUILDING_TYPES.MINER;
        
        // 各資源のカウント
        this.resourceCounts = {
            iron: 0,
            copper: 0,
            coal: 0
        };
        
        this.frameCounter = 0;
        
        // 統計情報追跡
        this.stats = {
            resourceRates: {
                iron: 0,
                copper: 0,
                coal: 0
            },
            lastResourceCounts: {
                iron: 0,
                copper: 0,
                coal: 0
            },
            lastStatsUpdate: Date.now(),
            productionHistory: [] // 生産グラフ用
        };
        
        // モジュール初期化
        this.terrain = TerrainGenerator.generateTerrain();
        this.buildingManager = new BuildingManager();
        this.itemManager = new ItemManager();
        this.renderer = new Renderer(this.canvas);
        
        this.setupEventListeners();
        this.setupProductionChart();
        this.gameLoop();
    }

    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // 建物選択ボタン
        document.getElementById('miner-btn').addEventListener('click', 
            () => this.selectTool(BUILDING_TYPES.MINER));
        document.getElementById('belt-btn').addEventListener('click', 
            () => this.selectTool(BUILDING_TYPES.BELT));
        document.getElementById('chest-btn').addEventListener('click', 
            () => this.selectTool(BUILDING_TYPES.CHEST));
        
        // キャンバスイベント
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        
        // プレビュー要素の初期化
        this.previewElement = null;
    }

    /**
     * ツール選択
     * @param {string} tool - 選択するツール
     */
    selectTool(tool) {
        this.selectedTool = tool;
        
        // ボタンの状態を更新
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            // ホバー効果をリセット
            btn.style.transform = '';
        });
        
        const activeBtn = document.getElementById(tool + '-btn');
        activeBtn.classList.add('active');
        
        // 選択フィードバック（軽い振動効果）
        activeBtn.style.transform = 'scale(1.05)';
        setTimeout(() => {
            activeBtn.style.transform = '';
        }, 150);
        
        // カーソルスタイルを変更
        this.updateCursorStyle(tool);
    }

    /**
     * カーソルスタイルを更新
     * @param {string} tool - 選択されたツール
     */
    updateCursorStyle(tool) {
        let cursor = 'crosshair';
        switch(tool) {
            case BUILDING_TYPES.MINER:
                cursor = 'crosshair';
                break;
            case BUILDING_TYPES.BELT:
                cursor = 'copy';
                break;
            case BUILDING_TYPES.CHEST:
                cursor = 'grab';
                break;
        }
        this.canvas.style.cursor = cursor;
    }

    /**
     * 座標変換
     * @param {number} clientX - クライアントX座標
     * @param {number} clientY - クライアントY座標
     * @returns {Object} グリッド座標
     */
    getGridPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / GAME_CONFIG.CELL_SIZE);
        const y = Math.floor((clientY - rect.top) / GAME_CONFIG.CELL_SIZE);
        return { x, y };
    }

    /**
     * クリック処理
     * @param {Event} e - クリックイベント
     */
    handleClick(e) {
        const { x, y } = this.getGridPosition(e.clientX, e.clientY);
        if (x >= 0 && x < GAME_CONFIG.GRID_WIDTH && y >= 0 && y < GAME_CONFIG.GRID_HEIGHT) {
            this.buildingManager.placeBuilding(x, y, this.selectedTool, this.terrain);
        }
    }

    /**
     * 右クリック処理
     * @param {Event} e - 右クリックイベント
     */
    handleRightClick(e) {
        const { x, y } = this.getGridPosition(e.clientX, e.clientY);
        if (x >= 0 && x < GAME_CONFIG.GRID_WIDTH && y >= 0 && y < GAME_CONFIG.GRID_HEIGHT) {
            this.buildingManager.removeBuilding(x, y);
        }
    }

    /**
     * マウス移動処理
     * @param {Event} e - マウス移動イベント
     */
    handleMouseMove(e) {
        const { x, y } = this.getGridPosition(e.clientX, e.clientY);
        if (x >= 0 && x < GAME_CONFIG.GRID_WIDTH && y >= 0 && y < GAME_CONFIG.GRID_HEIGHT) {
            this.showBuildingPreview(x, y, e.clientX, e.clientY);
        }
    }

    /**
     * マウスがキャンバスから離れた時の処理
     */
    handleMouseLeave() {
        this.hideBuildingPreview();
    }

    /**
     * 建物プレビューを表示
     * @param {number} gridX - グリッドX座標
     * @param {number} gridY - グリッドY座標
     * @param {number} mouseX - マウスX座標
     * @param {number} mouseY - マウスY座標
     */
    showBuildingPreview(gridX, gridY, mouseX, mouseY) {
        // 既存の建物がある場合はプレビューを表示しない
        if (this.buildingManager.getBuildingAt(gridX, gridY)) {
            this.hideBuildingPreview();
            return;
        }

        // プレビュー要素がない場合は作成
        if (!this.previewElement) {
            this.previewElement = document.createElement('div');
            this.previewElement.className = 'building-preview';
            document.body.appendChild(this.previewElement);
        }

        // 設置可能かチェック
        const canPlace = this.canPlaceBuilding(gridX, gridY, this.selectedTool);
        this.previewElement.className = canPlace ? 'building-preview' : 'building-preview invalid';

        // プレビューの位置とサイズを設定
        const cellSize = 32; // GAME_CONFIG.CELL_SIZEと同じ値
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = mouseX - rect.left;
        const canvasY = mouseY - rect.top;
        
        this.previewElement.style.left = `${rect.left + Math.floor(canvasX / cellSize) * cellSize}px`;
        this.previewElement.style.top = `${rect.top + Math.floor(canvasY / cellSize) * cellSize}px`;
        this.previewElement.style.width = `${cellSize}px`;
        this.previewElement.style.height = `${cellSize}px`;
        this.previewElement.style.display = 'block';
    }

    /**
     * 建物プレビューを非表示
     */
    hideBuildingPreview() {
        if (this.previewElement) {
            this.previewElement.style.display = 'none';
        }
    }

    /**
     * 建物が設置可能かチェック
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} type - 建物タイプ
     * @returns {boolean} 設置可能かどうか
     */
    canPlaceBuilding(x, y, type) {
        // 既に建物がある場合は設置不可
        if (this.buildingManager.getBuildingAt(x, y)) {
            return false;
        }

        // 採掘機は鉱石の上にのみ設置可能
        if (type === BUILDING_TYPES.MINER && this.terrain[y][x] !== 'ore') {
            return false;
        }

        return true;
    }

    /**
     * ゲーム更新
     */
    update() {
        // 採掘機の処理
        this.buildingManager.getAllBuildings().forEach(building => {
            if (building.type === BUILDING_TYPES.MINER) {
                building.timer++;
                if (building.timer >= GAME_CONFIG.MINING_INTERVAL) {
                    building.timer = 0;
                    // 建物に記録された資源タイプに基づいてアイテムを生成
                    const resourceType = building.resourceType || 'iron';
                    this.itemManager.addItem(building.x, building.y, resourceType);
                }
            }
        });
        
        // ベルトの処理
        this.frameCounter++;
        if (this.frameCounter >= GAME_CONFIG.BELT_MOVE_INTERVAL) {
            this.frameCounter = 0;
            const collectedItems = this.itemManager.moveItems(this.buildingManager);
            
            // 回収されたアイテムを資源別にカウント
            Object.keys(collectedItems).forEach(resourceType => {
                if (this.resourceCounts.hasOwnProperty(resourceType)) {
                    this.resourceCounts[resourceType] += collectedItems[resourceType];
                }
            });
        }
        
        // UI更新
        this.updateUI();
    }

    /**
     * UI更新
     */
    updateUI() {
        // 各資源の統計更新
        document.getElementById('iron-count').textContent = this.resourceCounts.iron;
        document.getElementById('copper-count').textContent = this.resourceCounts.copper;
        document.getElementById('coal-count').textContent = this.resourceCounts.coal;
        
        // 建物数の更新
        const minerCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.MINER);
        const beltCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.BELT);
        const chestCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.CHEST);
        
        document.getElementById('miner-count').textContent = minerCount;
        document.getElementById('belt-count').textContent = beltCount;
        document.getElementById('chest-count').textContent = chestCount;
        
        // 統計情報の更新
        this.updateStats();
        
        // 効率情報の更新
        this.updateEfficiencyStats(minerCount, beltCount, chestCount);
        
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            const totalItems = this.itemManager.getTotalItemCount();
            const itemsOnBelts = this.itemManager.getItemsOnBelts(this.buildingManager);
            
            debugElement.innerHTML = `
                建物: 採掘機${minerCount}個, ベルト${beltCount}個, チェスト${chestCount}個<br>
                マップ上のアイテム: ${totalItems}個 (ベルト上: ${itemsOnBelts}個)
            `;
        }
    }

    /**
     * 統計情報の更新
     */
    updateStats() {
        const now = Date.now();
        const timeDiff = now - this.stats.lastStatsUpdate;
        
        // 1秒ごとに統計を更新
        if (timeDiff >= 1000) {
            // 各資源の生産レートを計算
            Object.keys(this.resourceCounts).forEach(resourceType => {
                const currentCount = this.resourceCounts[resourceType];
                const lastCount = this.stats.lastResourceCounts[resourceType];
                const diff = currentCount - lastCount;
                const perSecond = diff / (timeDiff / 1000);
                this.stats.resourceRates[resourceType] = Math.round(perSecond * 60);
                
                // UI更新
                const rateElement = document.getElementById(`${resourceType}-rate`);
                if (rateElement) {
                    rateElement.textContent = `${this.stats.resourceRates[resourceType]}/分`;
                }
                
                // 最後のカウントを更新
                this.stats.lastResourceCounts[resourceType] = currentCount;
            });
            
            // 履歴に追加（最大60個まで保持）
            this.stats.productionHistory.push({
                time: now,
                ...this.resourceCounts,
                rates: {...this.stats.resourceRates}
            });
            
            if (this.stats.productionHistory.length > 60) {
                this.stats.productionHistory.shift();
            }
            
            // グラフ更新
            this.updateProductionChart();
            
            this.stats.lastStatsUpdate = now;
        }
    }

    /**
     * 効率統計の更新
     */
    updateEfficiencyStats(minerCount, beltCount, chestCount) {
        // 採掘機効率（実際に採掘している採掘機の割合）
        let activeMinerCount = 0;
        this.buildingManager.getAllBuildings().forEach(building => {
            if (building.type === BUILDING_TYPES.MINER) {
                // 隣にベルトがあるかチェック
                const hasAdjacentBelt = this.buildingManager.hasAdjacentBelt(building.x, building.y);
                if (hasAdjacentBelt) activeMinerCount++;
            }
        });
        
        const minerEfficiency = minerCount > 0 ? Math.round((activeMinerCount / minerCount) * 100) : 0;
        document.getElementById('miner-efficiency').textContent = `${minerEfficiency}% 稼働`;
        
        // ベルト使用率（アイテムが流れているベルトの割合）
        const itemsOnBelts = this.itemManager.getItemsOnBelts(this.buildingManager);
        const beltUsage = beltCount > 0 ? Math.min(100, Math.round((itemsOnBelts / beltCount) * 100)) : 0;
        document.getElementById('belt-usage').textContent = `${beltUsage}% 使用`;
        
        // チェスト容量（仮想的な容量計算）
        const maxChestCapacity = chestCount * 100; // 1チェストあたり100個と仮定
        const chestCapacity = maxChestCapacity > 0 ? Math.min(100, Math.round((this.ironCount / maxChestCapacity) * 100)) : 0;
        document.getElementById('chest-capacity').textContent = `${chestCapacity}% 満杯`;
    }

    /**
     * 生産グラフの設定
     */
    setupProductionChart() {
        this.chartCanvas = document.getElementById('productionChart');
        this.chartCtx = this.chartCanvas.getContext('2d');
    }

    /**
     * 生産グラフの更新
     */
    updateProductionChart() {
        if (!this.chartCtx || this.stats.productionHistory.length < 2) return;
        
        const ctx = this.chartCtx;
        const canvas = this.chartCanvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);
        
        // 背景
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, width, height);
        
        // グリッド線
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        
        // 縦線
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 横線
        for (let i = 0; i <= 5; i++) {
            const y = (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // データがない場合は終了
        if (this.stats.productionHistory.length === 0) return;
        
        // データの最大値を取得
        const maxIron = Math.max(...this.stats.productionHistory.map(d => d.iron), 1);
        
        // 生産量のライン
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.stats.productionHistory.forEach((data, index) => {
            const x = (width / (this.stats.productionHistory.length - 1)) * index;
            const y = height - (data.iron / maxIron) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 現在値の表示
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`最大: ${maxIron}`, width - 5, 15);
        ctx.fillText(`現在: ${this.ironCount}`, width - 5, height - 5);
    }
    render() {
        this.renderer.clear();
        this.renderer.renderTerrain(this.terrain);
        this.renderer.renderGrid();
        this.renderer.renderBuildings(this.buildingManager.getAllBuildings());
        this.renderer.renderItems(this.itemManager.items);
        
        // ヒント表示
        const buildings = this.buildingManager.getAllBuildings();
        const buildingCount = buildings.size;
        const hasMiners = this.buildingManager.getBuildingCount(BUILDING_TYPES.MINER) > 0;
        const hasBelts = this.buildingManager.getBuildingCount(BUILDING_TYPES.BELT) > 0;
        const hasChests = this.buildingManager.getBuildingCount(BUILDING_TYPES.CHEST) > 0;
        
        this.renderer.updateHints(buildingCount, hasMiners, hasBelts, hasChests);
    }

    /**
     * ゲームループ
     */
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * ゲーム状態を取得（テスト用）
     * @returns {Object} ゲーム状態
     */
    getGameState() {
        return {
            ironCount: this.ironCount,
            buildingCount: this.buildingManager.getAllBuildings().size,
            itemCount: this.itemManager.getTotalItemCount(),
            terrain: this.terrain
        };
    }
}
