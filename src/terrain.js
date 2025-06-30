import { GAME_CONFIG, TERRAIN_TYPES } from './config.js';

/**
 * 地形生成クラス
 */
export class TerrainGenerator {
    /**
     * ランダムな地形を生成（複数の資源タイプ対応）
     * @param {Object} resourceChances - 各資源の生成確率
     * @returns {Array<Array<string>>} 地形データ
     */
    static generateTerrain(resourceChances = {
        iron: 0.05,
        copper: 0.04,
        coal: 0.03
    }) {
        const terrain = [];
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
            terrain[y] = [];
            for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
                const random = Math.random();
                
                if (random < resourceChances.iron) {
                    terrain[y][x] = TERRAIN_TYPES.IRON_ORE;
                } else if (random < resourceChances.iron + resourceChances.copper) {
                    terrain[y][x] = TERRAIN_TYPES.COPPER_ORE;
                } else if (random < resourceChances.iron + resourceChances.copper + resourceChances.coal) {
                    terrain[y][x] = TERRAIN_TYPES.COAL;
                } else {
                    terrain[y][x] = TERRAIN_TYPES.GRASS;
                }
            }
        }
        return terrain;
    }

    /**
     * 指定位置の地形タイプを取得
     * @param {Array<Array<string>>} terrain - 地形データ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {string|null} 地形タイプまたはnull（範囲外）
     */
    static getTerrainAt(terrain, x, y) {
        if (x < 0 || x >= GAME_CONFIG.GRID_WIDTH || 
            y < 0 || y >= GAME_CONFIG.GRID_HEIGHT) {
            return null;
        }
        return terrain[y][x];
    }

    /**
     * 各資源エリアの数をカウント
     * @param {Array<Array<string>>} terrain - 地形データ
     * @returns {Object} 各資源エリアの数
     */
    static countResourceAreas(terrain) {
        const counts = {
            iron: 0,
            copper: 0,
            coal: 0,
            grass: 0
        };
        
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
                switch (terrain[y][x]) {
                    case TERRAIN_TYPES.IRON_ORE:
                        counts.iron++;
                        break;
                    case TERRAIN_TYPES.COPPER_ORE:
                        counts.copper++;
                        break;
                    case TERRAIN_TYPES.COAL:
                        counts.coal++;
                        break;
                    case TERRAIN_TYPES.GRASS:
                        counts.grass++;
                        break;
                }
            }
        }
        return counts;
    }

    /**
     * 指定位置が採掘可能な資源かチェック
     * @param {Array<Array<string>>} terrain - 地形データ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {boolean} 採掘可能かどうか
     */
    static isMineable(terrain, x, y) {
        const terrainType = this.getTerrainAt(terrain, x, y);
        return terrainType === TERRAIN_TYPES.IRON_ORE || 
               terrainType === TERRAIN_TYPES.COPPER_ORE || 
               terrainType === TERRAIN_TYPES.COAL;
    }

    /**
     * 地形タイプから資源タイプを取得
     * @param {string} terrainType - 地形タイプ
     * @returns {string|null} 資源タイプまたはnull
     */
    static getResourceType(terrainType) {
        switch (terrainType) {
            case TERRAIN_TYPES.IRON_ORE:
                return 'iron';
            case TERRAIN_TYPES.COPPER_ORE:
                return 'copper';
            case TERRAIN_TYPES.COAL:
                return 'coal';
            default:
                return null;
        }
    }

    /**
     * 鉱石エリアの総数をカウント（後方互換性のため）
     * @param {Array<Array<string>>} terrain - 地形データ
     * @returns {number} 鉱石エリアの総数
     */
    static countOreAreas(terrain) {
        const counts = this.countResourceAreas(terrain);
        return counts.iron + counts.copper + counts.coal;
    }
}
