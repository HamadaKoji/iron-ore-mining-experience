import { BUILDING_TYPES, TERRAIN_TYPES } from './config.js';

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
     * @returns {boolean} 設置成功かどうか
     */
    placeBuilding(x, y, type, terrain) {
        const key = `${x},${y}`;
        
        // 既に建物がある場合は設置不可
        if (this.buildings.has(key)) {
            return false;
        }

        // 採掘機は鉱石の上にのみ設置可能
        if (type === BUILDING_TYPES.MINER && terrain[y][x] !== TERRAIN_TYPES.ORE) {
            return false;
        }

        const building = {
            type: type,
            x: x,
            y: y,
            timer: 0
        };

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
}
