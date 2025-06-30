import { GAME_CONFIG, BUILDING_TYPES, DIRECTIONS } from './config.js';

/**
 * アイテム管理クラス
 */
export class ItemManager {
    constructor() {
        this.items = new Map(); // "x,y" -> item array
    }

    /**
     * アイテムを追加
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {string} type - アイテムタイプ
     */
    addItem(x, y, type) {
        const key = `${x},${y}`;
        if (!this.items.has(key)) {
            this.items.set(key, []);
        }
        this.items.get(key).push({ 
            type: type, 
            x: x, 
            y: y,
            createdTime: Date.now()
        });
    }

    /**
     * 指定位置のアイテムを取得
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Array} アイテム配列
     */
    getItemsAt(x, y) {
        const key = `${x},${y}`;
        return this.items.get(key) || [];
    }

    /**
     * アイテムを移動
     * @param {BuildingManager} buildingManager - 建物管理インスタンス
     * @returns {Object} 回収されたアイテム数（資源タイプ別）
     */
    moveItems(buildingManager) {
        const newItems = new Map();
        const collectedItems = {
            iron: 0,
            copper: 0,
            coal: 0,
            iron_plate: 0,
            copper_plate: 0
        };
        
        this.items.forEach((itemList, key) => {
            const [x, y] = key.split(',').map(Number);
            const currentBuilding = buildingManager.getBuildingAt(x, y);
            
            itemList.forEach(item => {
                let newX = x, newY = y;
                let shouldMove = false;
                
                // 採掘機の上のアイテムは、隣接するベルトの方向に移動
                if (currentBuilding && currentBuilding.type === BUILDING_TYPES.MINER) {
                    // 全方向の隣接セルをチェック
                    const adjacentPositions = [
                        { x: x + 1, y: y, expectedDir: DIRECTIONS.RIGHT },  // 右側のベルトは右向きである必要
                        { x: x, y: y + 1, expectedDir: DIRECTIONS.DOWN },   // 下側のベルトは下向きである必要
                        { x: x - 1, y: y, expectedDir: DIRECTIONS.LEFT },   // 左側のベルトは左向きである必要
                        { x: x, y: y - 1, expectedDir: DIRECTIONS.UP }      // 上側のベルトは上向きである必要
                    ];
                    
                    for (const pos of adjacentPositions) {
                        const adjacentBuilding = buildingManager.getBuildingAt(pos.x, pos.y);
                        if (adjacentBuilding && adjacentBuilding.type === BUILDING_TYPES.BELT) {
                            // ベルトが採掘機の方を向いているかチェック
                            if (adjacentBuilding.direction === pos.expectedDir) {
                                newX = pos.x;
                                newY = pos.y;
                                shouldMove = true;
                                break;
                            }
                        }
                    }
                }
                // ベルトの上のアイテムは方向に従って移動
                else if (currentBuilding && currentBuilding.type === BUILDING_TYPES.BELT) {
                    const direction = currentBuilding.direction || DIRECTIONS.RIGHT;
                    let nextX = x;
                    let nextY = y;
                    
                    switch (direction) {
                        case DIRECTIONS.RIGHT:
                            nextX = x + 1;
                            break;
                        case DIRECTIONS.DOWN:
                            nextY = y + 1;
                            break;
                        case DIRECTIONS.LEFT:
                            nextX = x - 1;
                            break;
                        case DIRECTIONS.UP:
                            nextY = y - 1;
                            break;
                    }
                    
                    const nextBuilding = buildingManager.getBuildingAt(nextX, nextY);
                    
                    if (nextBuilding && (nextBuilding.type === BUILDING_TYPES.BELT || 
                                       nextBuilding.type === BUILDING_TYPES.CHEST ||
                                       nextBuilding.type === BUILDING_TYPES.SMELTER)) {
                        newX = nextX;
                        newY = nextY;
                        shouldMove = true;
                    }
                }
                // 建物がない場所のアイテムも右に移動を試みる
                else if (!currentBuilding) {
                    newX = x + 1;
                    shouldMove = true;
                }
                
                // 境界チェック
                if (newX < 0 || newX >= GAME_CONFIG.GRID_WIDTH || 
                    newY < 0 || newY >= GAME_CONFIG.GRID_HEIGHT) {
                    newX = x;
                    newY = y;
                    shouldMove = false;
                }
                
                // 移動先をチェック
                if (shouldMove) {
                    const targetBuilding = buildingManager.getBuildingAt(newX, newY);
                    
                    // チェストに到達したアイテムは回収
                    if (targetBuilding && targetBuilding.type === BUILDING_TYPES.CHEST) {
                        // 資源タイプ別にカウント
                        if (collectedItems.hasOwnProperty(item.type)) {
                            collectedItems[item.type]++;
                        }
                        return; // アイテム消去（回収完了）
                    }
                    
                    // 製錬炉に到達したアイテムは投入を試みる
                    if (targetBuilding && targetBuilding.type === BUILDING_TYPES.SMELTER) {
                        if (buildingManager.canSmelterReceiveItem(targetBuilding, item.type)) {
                            buildingManager.addItemToSmelter(targetBuilding, item.type);
                            return; // アイテム消去（投入完了）
                        } else {
                            // 受け取れない場合は移動しない
                            newX = x;
                            newY = y;
                            shouldMove = false;
                        }
                    }
                }
                
                // 新しい位置にアイテム配置
                const finalKey = `${newX},${newY}`;
                if (!newItems.has(finalKey)) {
                    newItems.set(finalKey, []);
                }
                newItems.get(finalKey).push({ 
                    ...item, 
                    x: newX, 
                    y: newY,
                    createdTime: item.createdTime || Date.now()
                });
            });
        });
        
        this.items = newItems;
        return collectedItems;
    }

    /**
     * 全アイテム数を取得
     * @returns {number} アイテム総数
     */
    getTotalItemCount() {
        return Array.from(this.items.values())
            .reduce((sum, itemList) => sum + itemList.length, 0);
    }

    /**
     * ベルト上のアイテム数を取得
     * @param {BuildingManager} buildingManager - 建物管理インスタンス
     * @returns {number} ベルト上のアイテム数
     */
    getItemsOnBelts(buildingManager) {
        let count = 0;
        this.items.forEach((itemList, key) => {
            const [x, y] = key.split(',').map(Number);
            const building = buildingManager.getBuildingAt(x, y);
            if (building && building.type === BUILDING_TYPES.BELT) {
                count += itemList.length;
            }
        });
        return count;
    }

    /**
     * 全アイテムをクリア
     */
    clear() {
        this.items.clear();
    }
}
