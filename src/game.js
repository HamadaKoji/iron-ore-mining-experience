import { GAME_CONFIG, BUILDING_TYPES } from './config.js';
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
        this.ironCount = 0;
        this.frameCounter = 0;
        
        // モジュール初期化
        this.terrain = TerrainGenerator.generateTerrain();
        this.buildingManager = new BuildingManager();
        this.itemManager = new ItemManager();
        this.renderer = new Renderer(this.canvas);
        
        this.setupEventListeners();
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
        
        // キャンバスクリック
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }

    /**
     * ツール選択
     * @param {string} tool - 選択するツール
     */
    selectTool(tool) {
        this.selectedTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + '-btn').classList.add('active');
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
     * ゲーム更新
     */
    update() {
        // 採掘機の処理
        this.buildingManager.getAllBuildings().forEach(building => {
            if (building.type === BUILDING_TYPES.MINER) {
                building.timer++;
                if (building.timer >= GAME_CONFIG.MINING_INTERVAL) {
                    building.timer = 0;
                    this.itemManager.addItem(building.x, building.y, 'iron');
                }
            }
        });
        
        // ベルトの処理
        this.frameCounter++;
        if (this.frameCounter >= GAME_CONFIG.BELT_MOVE_INTERVAL) {
            this.frameCounter = 0;
            const collectedItems = this.itemManager.moveItems(this.buildingManager);
            this.ironCount += collectedItems;
        }
        
        // UI更新
        this.updateUI();
    }

    /**
     * UI更新
     */
    updateUI() {
        document.getElementById('iron-count').textContent = this.ironCount;
        
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            const totalItems = this.itemManager.getTotalItemCount();
            const minerCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.MINER);
            const beltCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.BELT);
            const chestCount = this.buildingManager.getBuildingCount(BUILDING_TYPES.CHEST);
            const itemsOnBelts = this.itemManager.getItemsOnBelts(this.buildingManager);
            
            debugElement.innerHTML = `
                建物: 採掘機${minerCount}個, ベルト${beltCount}個, チェスト${chestCount}個<br>
                マップ上のアイテム: ${totalItems}個 (ベルト上: ${itemsOnBelts}個)
            `;
        }
    }

    /**
     * 描画
     */
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
        
        this.renderer.renderHints(buildingCount, hasMiners, hasBelts, hasChests);
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
