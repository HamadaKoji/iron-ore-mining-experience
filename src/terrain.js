import { GAME_CONFIG, TERRAIN_TYPES } from './config.js';

/**
 * 地形生成クラス
 */
export class TerrainGenerator {
    /**
     * ランダムな地形を生成
     * @param {number} oreChance - 鉱石生成確率 (0-1)
     * @returns {Array<Array<string>>} 地形データ
     */
    static generateTerrain(oreChance = 0.2) {
        const terrain = [];
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
            terrain[y] = [];
            for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
                terrain[y][x] = Math.random() < oreChance ? 
                    TERRAIN_TYPES.ORE : TERRAIN_TYPES.GRASS;
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
     * 鉱石エリアの数をカウント
     * @param {Array<Array<string>>} terrain - 地形データ
     * @returns {number} 鉱石エリアの数
     */
    static countOreAreas(terrain) {
        let count = 0;
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
                if (terrain[y][x] === TERRAIN_TYPES.ORE) {
                    count++;
                }
            }
        }
        return count;
    }
}
