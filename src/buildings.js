import { BUILDING_TYPES, TERRAIN_TYPES, DIRECTIONS } from './config.js';
import { TerrainGenerator } from './terrain.js';

/**
 * 建物管理クラス
 */
export class BuildingManager {
    constructor() {
        this.buildings = new Map(); // "x,y" -> building object
    }

    /**
     * 建物を設置
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} type - 建物タイプ
     * @param {Array<Array<string>>} terrain - 地形データ
     * @param {string} direction - ベルトの方向（ベルトの場合のみ使用）
     * @returns {boolean} 設置成功かどうか
     */
    placeBuilding(x, y, type, terrain, direction = DIRECTIONS.RIGHT) {
        const key = `${x},${y}`;
        
        // 既に建物がある場合は設置不可
        if (this.buildings.has(key)) {
            return false;
        }

        // 採掘機は採掘可能な資源の上にのみ設置可能
        if (type === BUILDING_TYPES.MINER && !TerrainGenerator.isMineable(terrain, x, y)) {
            return false;
        }

        // 製錬炉は草地にのみ設置可能
        if (type === BUILDING_TYPES.SMELTER && terrain[y][x] !== TERRAIN_TYPES.GRASS) {
            return false;
        }

        const building = {
            type: type,
            x: x,
            y: y,
            timer: 0,
            // 採掘機の場合、採掘する資源タイプを記録
            resourceType: type === BUILDING_TYPES.MINER ? 
                TerrainGenerator.getResourceType(terrain[y][x]) : null,
            // ベルトの場合、方向を記録
            direction: type === BUILDING_TYPES.BELT ? direction : null
        };

        // 製錬炉の場合、追加の状態を初期化
        if (type === BUILDING_TYPES.SMELTER) {
            building.inputOre = null;      // 入力鉱石
            building.inputCoal = null;     // 入力石炭
            building.smeltingProgress = 0; // 製錬進行度
            building.outputBuffer = null;  // 出力バッファ
        }

        this.buildings.set(key, building);
        return true;
    }

    /**
     * 建物を削除
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {boolean} 削除成功かどうか
     */
    removeBuilding(x, y) {
        const key = `${x},${y}`;
        return this.buildings.delete(key);
    }

    /**
     * 指定位置の建物を取得
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Object|undefined} 建物オブジェクトまたはundefined
     */
    getBuildingAt(x, y) {
        const key = `${x},${y}`;
        return this.buildings.get(key);
    }

    /**
     * 全建物を取得
     * @returns {Map} 建物マップ
     */
    getAllBuildings() {
        return this.buildings;
    }

    /**
     * 指定タイプの建物数を取得
     * @param {string} type - 建物タイプ
     * @returns {number} 建物数
     */
    getBuildingCount(type) {
        return Array.from(this.buildings.values())
            .filter(building => building.type === type).length;
    }

    /**
     * 全建物をクリア
     */
    clear() {
        this.buildings.clear();
    }

    /**
     * 指定位置に隣接するベルトがあるかチェック
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} direction - チェックする方向（オプション）
     * @returns {boolean} 隣接ベルトの有無
     */
    hasAdjacentBelt(x, y, direction = DIRECTIONS.RIGHT) {
        let adjacentX = x;
        let adjacentY = y;
        
        switch (direction) {
            case DIRECTIONS.RIGHT:
                adjacentX = x + 1;
                break;
            case DIRECTIONS.DOWN:
                adjacentY = y + 1;
                break;
            case DIRECTIONS.LEFT:
                adjacentX = x - 1;
                break;
            case DIRECTIONS.UP:
                adjacentY = y - 1;
                break;
        }
        
        const adjacentBuilding = this.getBuildingAt(adjacentX, adjacentY);
        return adjacentBuilding && adjacentBuilding.type === BUILDING_TYPES.BELT;
    }

    /**
     * 製錬炉がアイテムを受け取れるかチェック
     * @param {Object} smelter - 製錬炉建物オブジェクト
     * @param {string} itemType - アイテムタイプ
     * @returns {boolean} 受け取り可能かどうか
     */
    canSmelterReceiveItem(smelter, itemType) {
        if (smelter.type !== BUILDING_TYPES.SMELTER) {
            return false;
        }

        // 石炭の場合
        if (itemType === 'coal' && !smelter.inputCoal) {
            return true;
        }

        // 鉱石の場合（鉄または銅）
        if ((itemType === 'iron' || itemType === 'copper') && !smelter.inputOre) {
            return true;
        }

        return false;
    }

    /**
     * 製錬炉にアイテムを投入
     * @param {Object} smelter - 製錬炉建物オブジェクト
     * @param {string} itemType - アイテムタイプ
     */
    addItemToSmelter(smelter, itemType) {
        if (itemType === 'coal') {
            smelter.inputCoal = itemType;
        } else if (itemType === 'iron' || itemType === 'copper') {
            smelter.inputOre = itemType;
        }
    }

    /**
     * 製錬炉の稼働率を計算
     * @returns {number} 稼働率（0-100）
     */
    getSmelterUtilization() {
        const smelters = Array.from(this.buildings.values())
            .filter(building => building.type === BUILDING_TYPES.SMELTER);
        
        if (smelters.length === 0) return 0;

        const workingSmelters = smelters.filter(smelter => 
            smelter.smeltingProgress > 0 || smelter.outputBuffer !== null
        ).length;

        return Math.round((workingSmelters / smelters.length) * 100);
    }
}
