import { GAME_CONFIG, BUILDING_TYPES, RESOURCE_TYPES, DIRECTIONS } from './config.js';
import { TerrainGenerator } from './terrain.js';
import { BuildingManager } from './buildings.js';
import { ItemManager } from './items.js';
import { Renderer } from './renderer.js';
import { EfficiencyChart } from './efficiency-chart.js';

// LocalStorageキー
const MAX_EFFICIENCY_KEY = 'maxBeltEfficiency';

/**
 * メインゲームクラス
 */
export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.selectedTool = BUILDING_TYPES.MINER;
        this.selectedBeltDirection = DIRECTIONS.RIGHT;
        
        // 各資源のカウント
        this.resourceCounts = {
            iron: 0,
            copper: 0,
            coal: 0,
            iron_plate: 0,
            copper_plate: 0
        };
        
        // 総生産量のカウント
        this.totalProduced = {
            iron: 0,
            copper: 0,
            coal: 0,
            iron_plate: 0,
            copper_plate: 0
        };
        
        this.frameCounter = 0;
        
        // 統計情報追跡
        this.stats = {
            resourceRates: {
                iron: 0,
                copper: 0,
                coal: 0,
                iron_plate: 0,
                copper_plate: 0
            },
            lastResourceCounts: {
                iron: 0,
                copper: 0,
                coal: 0,
                iron_plate: 0,
                copper_plate: 0
            },
            lastStatsUpdate: Date.now(),
            productionHistory: [], // 生産グラフ用
            lastEfficiencyUpdate: Date.now(),
            efficiencyHistory: [], // 効率グラフ用
            maxBeltEfficiency: this.loadMaxEfficiency() // 最大効率を読み込み
        };
        
        // モジュール初期化
        this.terrain = TerrainGenerator.generateTerrain();
        this.buildingManager = new BuildingManager();
        this.itemManager = new ItemManager();
        this.renderer = new Renderer(this.canvas);
        this.efficiencyChart = new EfficiencyChart('efficiencyChart');
        
        this.setupEventListeners();
        this.updateMaxEfficiencyDisplay(); // 初期表示
        this.gameLoop();
    }
    
    /**
     * ローカルストレージから最大効率を読み込み
     * @returns {Object} 最大効率データ
     */
    loadMaxEfficiency() {
        const saved = localStorage.getItem(MAX_EFFICIENCY_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            value: 0,
            date: null,
            metalRate: 0,
            beltCount: 0
        };
    }
    
    /**
     * 最大効率を保存
     * @param {number} efficiency - 効率値
     * @param {number} metalRate - 金属板生産レート
     * @param {number} beltCount - ベルト数
     * @param {number} operatingEfficiency - 稼働効率
     * @param {Object} buildingStats - 建物統計
     */
    saveMaxEfficiency(efficiency, metalRate, beltCount, operatingEfficiency = 0, buildingStats = {}) {
        const data = {
            value: efficiency,
            date: new Date().toISOString(),
            metalRate: metalRate,
            beltCount: beltCount,
            operatingEfficiency: operatingEfficiency,
            buildingStats: buildingStats
        };
        this.stats.maxBeltEfficiency = data;
        localStorage.setItem(MAX_EFFICIENCY_KEY, JSON.stringify(data));
    }
    
    /**
     * カウントをリセットするヘルパー関数
     */
    resetCounts() {
        // 生産カウントをリセット
        Object.keys(this.totalProduced).forEach(key => {
            this.totalProduced[key] = 0;
        });
        Object.keys(this.resourceCounts).forEach(key => {
            this.resourceCounts[key] = 0;
        });
    }

    /**
     * ゲームをリセット（建物を全て削除、記録もリセット）
     */
    resetGame() {
        if (confirm('ゲームをリセットしますか？\n全ての建物が削除されます。\n（ベストスコアは保持されます）')) {
            // 建物を全て削除
            this.buildingManager.clear();
            this.itemManager.clear();
            
            // カウントをリセット
            this.resetCounts();
            
            // 統計をリセット
            Object.keys(this.stats.resourceRates).forEach(key => {
                this.stats.resourceRates[key] = 0;
                this.stats.lastResourceCounts[key] = 0;
            });
            this.stats.productionHistory = [];
            this.stats.efficiencyHistory = [];
            
            // 最大効率記録は保持（リセットしない）
            
            // グラフをクリア
            this.efficiencyChart.data = new Array(this.efficiencyChart.maxDataPoints).fill(0);
            this.efficiencyChart.draw();
        }
    }

    /**
     * ベストスコアをクリア
     */
    clearBestScore() {
        if (confirm('ベストスコアをクリアしますか？\nゲーム画面もリセットされます。')) {
            // ベストスコアをクリア
            localStorage.removeItem(MAX_EFFICIENCY_KEY);
            this.maxEfficiency = 0;
            
            // ゲームもリセット（確認なし）
            this.buildingManager.clear();
            this.itemManager.clear();
            
            // カウントをリセット
            this.resetCounts();
            
            // 統計をリセット
            Object.keys(this.stats.resourceRates).forEach(key => {
                this.stats.resourceRates[key] = 0;
                this.stats.lastResourceCounts[key] = 0;
            });
            this.stats.productionHistory = [];
            this.stats.efficiencyHistory = [];
            
            // グラフをクリア
            this.efficiencyChart.data = new Array(this.efficiencyChart.maxDataPoints).fill(0);
            this.efficiencyChart.draw();
            
            // UIを更新
            this.updateDisplay();
            this.updateMaxEfficiencyDisplay();
        }
    }

    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // 建物選択ボタン
        document.getElementById('miner-btn').addEventListener('click', 
            () => this.selectTool(BUILDING_TYPES.MINER));
        document.getElementById('smelter-btn')?.addEventListener('click', 
            () => this.selectTool(BUILDING_TYPES.SMELTER));
        
        // ベルトボタン（各方向）
        this.setupBeltButtons();
        
        // リセットボタン
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetGame());
        
        // ベストスコアクリアボタン
        document.getElementById('clear-best-score-btn')?.addEventListener('click', () => this.clearBestScore());
        
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
     * ベルトボタンの設定
     */
    setupBeltButtons() {
        const beltButtons = document.querySelectorAll('.belt-btn');
        
        beltButtons.forEach(button => {
            button.addEventListener('click', () => {
                const direction = button.dataset.direction;
                const directionMap = {
                    'right': DIRECTIONS.RIGHT,
                    'down': DIRECTIONS.DOWN,
                    'left': DIRECTIONS.LEFT,
                    'up': DIRECTIONS.UP
                };
                
                this.selectedBeltDirection = directionMap[direction];
                this.selectTool(BUILDING_TYPES.BELT);
                
                // すべてのベルトボタンからアクティブクラスを削除
                beltButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    /**
     * ツール選択
     * @param {string} tool - 選択するツール
     */
    selectTool(tool) {
        this.selectedTool = tool;
        
        // すべてのツールボタンからアクティブクラスを削除
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.transform = '';
        });
        
        // ベルトの場合は対応する方向のボタンをアクティブに
        if (tool === BUILDING_TYPES.BELT) {
            const directionMap = {
                [DIRECTIONS.RIGHT]: 'belt-right-btn',
                [DIRECTIONS.DOWN]: 'belt-down-btn',
                [DIRECTIONS.LEFT]: 'belt-left-btn',
                [DIRECTIONS.UP]: 'belt-up-btn'
            };
            const activeBeltBtn = document.getElementById(directionMap[this.selectedBeltDirection]);
            if (activeBeltBtn) {
                activeBeltBtn.classList.add('active');
                // 選択フィードバック（軽い振動効果）
                activeBeltBtn.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    activeBeltBtn.style.transform = '';
                }, 150);
            }
        } else {
            // 通常の建物ボタンの場合
            const activeBtn = document.getElementById(tool + '-btn');
            if (activeBtn) {
                activeBtn.classList.add('active');
                // 選択フィードバック（軽い振動効果）
                activeBtn.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    activeBtn.style.transform = '';
                }, 150);
            }
        }
        
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
            const direction = this.selectedTool === BUILDING_TYPES.BELT ? this.selectedBeltDirection : null;
            this.buildingManager.placeBuilding(x, y, this.selectedTool, this.terrain, direction);
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

        // プレビューの位置とサイズを設定（グリッドサイズに合わせる）
        const cellSize = GAME_CONFIG.CELL_SIZE;
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
                    
                    // 総生産量を更新
                    if (this.totalProduced.hasOwnProperty(resourceType)) {
                        this.totalProduced[resourceType]++;
                    }
                }
            }
            // 製錬炉の処理
            else if (building.type === BUILDING_TYPES.SMELTER) {
                // 材料が揃っていて、出力バッファが空の場合、製錬開始
                if (building.inputOre && building.inputCoal && !building.outputBuffer && building.smeltingProgress === 0) {
                    building.smeltingProgress = 1;
                }
                
                // 製錬中の処理
                if (building.smeltingProgress > 0) {
                    building.smeltingProgress++;
                    
                    // 製錬完了
                    if (building.smeltingProgress >= GAME_CONFIG.SMELTING_TIME) {
                        // 出力アイテムを決定
                        if (building.inputOre === 'iron') {
                            building.outputBuffer = 'iron_plate';
                            // 総生産量を更新
                            this.totalProduced.iron_plate++;
                        } else if (building.inputOre === 'copper') {
                            building.outputBuffer = 'copper_plate';
                            // 総生産量を更新
                            this.totalProduced.copper_plate++;
                        }
                        
                        building.inputOre = null;
                        building.inputCoal = null;
                        building.smeltingProgress = 0;
                    }
                }
                
                // 出力バッファにアイテムがあり、隣接するベルトがある場合、アイテムを排出
                if (building.outputBuffer) {
                    // 全方向の隣接ベルトをチェック（どの方向のベルトでも出力可能）
                    const adjacentPositions = [
                        { x: building.x + 1, y: building.y },
                        { x: building.x, y: building.y + 1 },
                        { x: building.x - 1, y: building.y },
                        { x: building.x, y: building.y - 1 }
                    ];
                    
                    for (const pos of adjacentPositions) {
                        const adjacentBuilding = this.buildingManager.getBuildingAt(pos.x, pos.y);
                        if (adjacentBuilding && adjacentBuilding.type === BUILDING_TYPES.BELT) {
                            this.itemManager.addItem(pos.x, pos.y, building.outputBuffer);
                            building.outputBuffer = null;
                            break;
                        }
                    }
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
        // 各資源の統計更新（総生産量を表示）
        document.getElementById('iron-count').textContent = this.totalProduced.iron;
        document.getElementById('copper-count').textContent = this.totalProduced.copper;
        document.getElementById('coal-count').textContent = this.totalProduced.coal;
        document.getElementById('iron-plate-count').textContent = this.totalProduced.iron_plate;
        document.getElementById('copper-plate-count').textContent = this.totalProduced.copper_plate;
        
        // 建物数の更新
        const minerCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.MINER);
        const beltCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.BELT);
        const smelterCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.SMELTER);
        
        document.getElementById('miner-count').textContent = minerCount;
        document.getElementById('belt-count').textContent = beltCount;
        document.getElementById('smelter-count').textContent = smelterCount;
        
        // 統計情報の更新
        this.updateStats();
        
        // 効率情報の更新
        this.updateEfficiencyStats(minerCount, beltCount, smelterCount);
        
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            const totalItems = this.itemManager.getTotalItemCount();
            const itemsOnBelts = this.itemManager.getItemsOnBelts(this.buildingManager);
            
            // 資源数をカウント
            const resourceCounts = TerrainGenerator.countResourceAreas(this.terrain);
            
            debugElement.innerHTML = `
                建物: 採掘機${minerCount}個, ベルト${beltCount}個, 製錬炉${smelterCount}個<br>
                マップ上のアイテム: ${totalItems}個 (ベルト上: ${itemsOnBelts}個)<br>
                資源エリア: 鉄${resourceCounts.iron}個, 銅${resourceCounts.copper}個, 石炭${resourceCounts.coal}個
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
            Object.keys(this.totalProduced).forEach(resourceType => {
                const currentCount = this.totalProduced[resourceType];
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
                ...this.totalProduced,
                rates: {...this.stats.resourceRates}
            });
            
            if (this.stats.productionHistory.length > 60) {
                this.stats.productionHistory.shift();
            }
            
            this.stats.lastStatsUpdate = now;
        }
    }

    /**
     * 効率統計の更新
     */
    updateEfficiencyStats(minerCount, beltCount, smelterCount) {
        // 採掘機効率（実際に採掘している採掘機の割合）
        let activeMinerCount = 0;
        this.buildingManager.getAllBuildings().forEach(building => {
            if (building.type === BUILDING_TYPES.MINER) {
                // 全方向の隣接ベルトをチェック
                const adjacentPositions = [
                    { x: building.x + 1, y: building.y, dir: DIRECTIONS.RIGHT },
                    { x: building.x, y: building.y + 1, dir: DIRECTIONS.DOWN },
                    { x: building.x - 1, y: building.y, dir: DIRECTIONS.LEFT },
                    { x: building.x, y: building.y - 1, dir: DIRECTIONS.UP }
                ];
                
                let hasProperBelt = false;
                for (const pos of adjacentPositions) {
                    const adjacentBuilding = this.buildingManager.getBuildingAt(pos.x, pos.y);
                    if (adjacentBuilding && adjacentBuilding.type === BUILDING_TYPES.BELT && 
                        adjacentBuilding.direction === pos.dir) {
                        hasProperBelt = true;
                        break;
                    }
                }
                
                if (hasProperBelt) activeMinerCount++;
            }
        });
        
        const minerEfficiency = minerCount > 0 ? Math.round((activeMinerCount / minerCount) * 100) : 0;
        document.getElementById('miner-efficiency').textContent = `${minerEfficiency}% 稼働`;
        
        // ベルト使用率（アイテムが流れているベルトの割合）
        const itemsOnBelts = this.itemManager.getItemsOnBelts(this.buildingManager);
        const beltUsage = beltCount > 0 ? Math.min(100, Math.round((itemsOnBelts / beltCount) * 100)) : 0;
        document.getElementById('belt-usage').textContent = `${beltUsage}% 使用`;
        
        
        // 製錬炉稼働率
        const smelterEfficiency = this.buildingManager.getSmelterUtilization();
        document.getElementById('smelter-efficiency').textContent = `${smelterEfficiency}% 稼働`;
        
        // ベルト効率の計算と更新
        this.updateBeltEfficiency(beltCount, activeMinerCount, minerCount, smelterCount);
    }

    /**
     * ベルト効率の更新
     * @param {number} beltCount - ベルトの総数
     * @param {number} activeMinerCount - 稼働中の採掘機数
     * @param {number} minerCount - 採掘機の総数
     * @param {number} smelterCount - 製錬炉の総数
     */
    updateBeltEfficiency(beltCount, activeMinerCount, minerCount, smelterCount) {
        const now = Date.now();
        const timeDiff = now - this.stats.lastEfficiencyUpdate;
        
        // 総金属板生産レート（鉄板 + 銅板）
        const totalMetalRate = this.stats.resourceRates.iron_plate + this.stats.resourceRates.copper_plate;
        
        // UI要素を常に更新
        document.getElementById('total-metal-rate').textContent = totalMetalRate;
        
        // 稼働中の製錬炉数を取得
        const activeSmelterCount = this.buildingManager.getActiveSmelterCount();
        
        // 全体の建物数
        const totalBuildings = minerCount + beltCount + smelterCount;
        
        // 生産密度システムによる効率計算
        const efficiencyElement = document.getElementById('belt-efficiency');
        let currentEfficiency = 0;
        let operatingEfficiency = 0;
        
        if (totalBuildings === 0) {
            efficiencyElement.textContent = '建物なし';
            efficiencyElement.style.color = '#95a5a6';
        } else {
            // 稼働効率 = (稼働中の採掘機数 × 稼働中の製錬炉数) ÷ 総建物数
            operatingEfficiency = (activeMinerCount * activeSmelterCount) / totalBuildings;
            
            // 効率スコア = 総金属板生産量 × 稼働効率
            currentEfficiency = totalMetalRate * operatingEfficiency;
            
            efficiencyElement.textContent = currentEfficiency.toFixed(1);
            
            // 効率に応じて色を変更（高効率: 緑、低効率: 赤）
            if (currentEfficiency >= 100.0) {
                efficiencyElement.style.color = '#9b59b6'; // 紫（伝説的）
            } else if (currentEfficiency >= 50.0) {
                efficiencyElement.style.color = '#2ecc71'; // 緑
            } else if (currentEfficiency >= 20.0) {
                efficiencyElement.style.color = '#f39c12'; // オレンジ
            } else {
                efficiencyElement.style.color = '#e74c3c'; // 赤
            }
            
            // 最大効率を更新
            if (currentEfficiency > this.stats.maxBeltEfficiency.value) {
                const buildingStats = {
                    activeMinerCount: activeMinerCount,
                    activeSmelterCount: activeSmelterCount,
                    totalBuildings: totalBuildings
                };
                this.saveMaxEfficiency(currentEfficiency, totalMetalRate, beltCount, operatingEfficiency, buildingStats);
                this.updateMaxEfficiencyDisplay();
            }
        }
        
        // 詳細情報を更新
        document.getElementById('operating-efficiency').textContent = `稼働効率: ${(operatingEfficiency * 100).toFixed(1)}%`;
        
        // 最大効率表示を更新
        this.updateMaxEfficiencyDisplay();
        
        // 15秒ごとにグラフを更新
        if (timeDiff >= 15000) {
            // 効率履歴に追加
            this.stats.efficiencyHistory.push({
                time: now,
                efficiency: currentEfficiency,
                totalMetalRate: totalMetalRate,
                beltCount: beltCount
            });
            
            // 最大20個まで保持（5分間のデータ）
            if (this.stats.efficiencyHistory.length > 20) {
                this.stats.efficiencyHistory.shift();
            }
            
            // グラフを更新
            this.efficiencyChart.updateData(currentEfficiency);
            
            this.stats.lastEfficiencyUpdate = now;
        }
    }
    
    /**
     * 最大効率表示を更新
     */
    updateMaxEfficiencyDisplay() {
        const maxEffElement = document.getElementById('max-efficiency');
        const maxEffDateElement = document.getElementById('max-efficiency-date');
        const maxEffDetailElement = document.getElementById('max-efficiency-detail');
        
        if (maxEffElement && this.stats.maxBeltEfficiency.value > 0) {
            maxEffElement.textContent = this.stats.maxBeltEfficiency.value.toFixed(1);
            
            if (maxEffDateElement && this.stats.maxBeltEfficiency.date) {
                const date = new Date(this.stats.maxBeltEfficiency.date);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                maxEffDateElement.textContent = dateStr;
            }
            
            if (maxEffDetailElement) {
                const eff = this.stats.maxBeltEfficiency;
                if (eff.operatingEfficiency !== undefined) {
                    maxEffDetailElement.textContent = `生産${eff.metalRate}個/分 × 稼働率${(eff.operatingEfficiency * 100).toFixed(1)}%`;
                } else {
                    // 旧データの場合
                    maxEffDetailElement.textContent = `金属板${eff.metalRate}個/分`;
                }
            }
        } else if (maxEffElement) {
            maxEffElement.textContent = '--';
            if (maxEffDateElement) maxEffDateElement.textContent = '';
            if (maxEffDetailElement) maxEffDetailElement.textContent = 'まだ記録がありません';
        }
    }

    /**
     * 生産グラフの設定
     */
    setupProductionChart() {
        this.chartCanvas = document.getElementById('productionChart');
        this.chartCtx = this.chartCanvas.getContext('2d');
    }

    /**
     * 生産グラフの更新（全資源合計対応）
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
        
        // 全資源の合計値を計算してデータの最大値を取得
        const totalProduction = this.stats.productionHistory.map(data => {
            return (data.iron || 0) + (data.copper || 0) + (data.coal || 0);
        });
        const maxTotal = Math.max(...totalProduction, 1);
        
        // 生産量のライン（全資源合計）
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        this.stats.productionHistory.forEach((data, index) => {
            const totalValue = (data.iron || 0) + (data.copper || 0) + (data.coal || 0);
            const x = (width / (this.stats.productionHistory.length - 1)) * index;
            const y = height - (totalValue / maxTotal) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 個別資源のライン（薄い色で表示）
        const resourceColors = {
            iron: '#e67e22',
            copper: '#d35400', 
            coal: '#7f8c8d'
        };
        
        Object.keys(resourceColors).forEach(resourceType => {
            const maxResource = Math.max(...this.stats.productionHistory.map(d => d[resourceType] || 0), 1);
            
            ctx.strokeStyle = resourceColors[resourceType];
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            
            this.stats.productionHistory.forEach((data, index) => {
                const value = data[resourceType] || 0;
                const x = (width / (this.stats.productionHistory.length - 1)) * index;
                const y = height - (value / maxTotal) * height; // 同じスケールを使用
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        });
        
        ctx.globalAlpha = 1.0;
        
        // 現在値の表示（全資源合計）
        const currentTotal = this.totalProduced.iron + this.totalProduced.copper + this.totalProduced.coal;
        
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`最大: ${maxTotal}`, width - 5, 15);
        ctx.fillText(`合計: ${currentTotal}`, width - 5, height - 5);
        
        // 凡例
        ctx.textAlign = 'left';
        ctx.font = '10px Arial';
        ctx.fillStyle = '#3498db';
        ctx.fillText('━ 合計', 5, 15);
        ctx.fillStyle = '#e67e22';
        ctx.fillText('━ 鉄', 5, 30);
        ctx.fillStyle = '#d35400';
        ctx.fillText('━ 銅', 5, 45);
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('━ 石炭', 5, 60);
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
        const hasSmelters = this.buildingManager.getBuildingCount(BUILDING_TYPES.SMELTER) > 0;
        const metalPlateCount = this.totalProduced.iron_plate + this.totalProduced.copper_plate;
        
        this.renderer.updateHints(buildingCount, hasMiners, hasBelts, hasSmelters, metalPlateCount);
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
