import { GAME_CONFIG, TERRAIN_TYPES } from './config.js';

/**
 * 地形生成クラス
 */
export class TerrainGenerator {
    /**
     * クラスター状の資源配置で地形を生成
     * @returns {Array<Array<string>>} 地形データ
     */
    static generateTerrain() {
        // 固定の資源数
        const resourceTargets = {
            [TERRAIN_TYPES.IRON_ORE]: 25,
            [TERRAIN_TYPES.COPPER_ORE]: 20,
            [TERRAIN_TYPES.COAL]: 15
        };
        
        // 初期化（全て草地）
        const terrain = [];
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
            terrain[y] = [];
            for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
                terrain[y][x] = TERRAIN_TYPES.GRASS;
            }
        }
        
        // 各資源タイプごとにクラスターを生成
        for (const [resourceType, targetCount] of Object.entries(resourceTargets)) {
            this.generateResourceClusters(terrain, resourceType, targetCount);
        }
        
        return terrain;
    }
    
    /**
     * 指定された資源タイプのクラスターを生成
     * @param {Array<Array<string>>} terrain - 地形データ
     * @param {string} resourceType - 資源タイプ
     * @param {number} targetCount - 目標数
     */
    static generateResourceClusters(terrain, resourceType, targetCount) {
        let placedCount = 0;
        const clusterCount = Math.ceil(targetCount / 7); // 平均7個のクラスター
        
        for (let i = 0; i < clusterCount && placedCount < targetCount; i++) {
            // クラスターの中心点をランダムに選択
            let centerX, centerY;
            let attempts = 0;
            do {
                centerX = Math.floor(Math.random() * GAME_CONFIG.GRID_WIDTH);
                centerY = Math.floor(Math.random() * GAME_CONFIG.GRID_HEIGHT);
                attempts++;
            } while (terrain[centerY][centerX] !== TERRAIN_TYPES.GRASS && attempts < 100);
            
            if (attempts >= 100) continue;
            
            // クラスターのサイズを決定
            const clusterSize = Math.min(
                targetCount - placedCount,
                Math.floor(Math.random() * 5) + 5 // 5-9個のクラスター
            );
            
            // クラスターを生成
            const placed = this.placeCluster(terrain, resourceType, centerX, centerY, clusterSize);
            placedCount += placed;
        }
        
        // 目標数に満たない場合は、ランダムに配置
        while (placedCount < targetCount) {
            const x = Math.floor(Math.random() * GAME_CONFIG.GRID_WIDTH);
            const y = Math.floor(Math.random() * GAME_CONFIG.GRID_HEIGHT);
            if (terrain[y][x] === TERRAIN_TYPES.GRASS) {
                terrain[y][x] = resourceType;
                placedCount++;
            }
        }
    }
    
    /**
     * クラスターを配置
     * @param {Array<Array<string>>} terrain - 地形データ
     * @param {string} resourceType - 資源タイプ
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     * @param {number} size - クラスターサイズ
     * @returns {number} 配置した数
     */
    static placeCluster(terrain, resourceType, centerX, centerY, size) {
        let placed = 0;
        const toPlace = [{x: centerX, y: centerY}];
        const placed_positions = new Set();
        
        while (toPlace.length > 0 && placed < size) {
            const pos = toPlace.shift();
            const key = `${pos.x},${pos.y}`;
            
            if (placed_positions.has(key)) continue;
            if (pos.x < 0 || pos.x >= GAME_CONFIG.GRID_WIDTH || 
                pos.y < 0 || pos.y >= GAME_CONFIG.GRID_HEIGHT) continue;
            if (terrain[pos.y][pos.x] !== TERRAIN_TYPES.GRASS) continue;
            
            // 配置
            terrain[pos.y][pos.x] = resourceType;
            placed_positions.add(key);
            placed++;
            
            // 隣接セルを候補に追加（確率的に）
            const directions = [
                {dx: 1, dy: 0}, {dx: -1, dy: 0},
                {dx: 0, dy: 1}, {dx: 0, dy: -1}
            ];
            
            for (const dir of directions) {
                if (Math.random() < 0.7) { // 70%の確率で隣接セルに拡張
                    toPlace.push({
                        x: pos.x + dir.dx,
                        y: pos.y + dir.dy
                    });
                }
            }
        }
        
        return placed;
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
