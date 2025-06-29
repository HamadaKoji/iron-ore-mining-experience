import { GAME_CONFIG, BUILDING_TYPES } from './config.js';

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
     * @returns {number} 回収されたアイテム数
     */
    moveItems(buildingManager) {
        const newItems = new Map();
        let collectedItems = 0;
        
        this.items.forEach((itemList, key) => {
            const [x, y] = key.split(',').map(Number);
            const currentBuilding = buildingManager.getBuildingAt(x, y);
            
            itemList.forEach(item => {
                let newX = x, newY = y;
                let shouldMove = false;
                
                // 採掘機の上のアイテムは、隣がベルトの場合のみ移動
                if (currentBuilding && currentBuilding.type === BUILDING_TYPES.MINER) {
                    const rightBuilding = buildingManager.getBuildingAt(x + 1, y);
                    if (rightBuilding && rightBuilding.type === BUILDING_TYPES.BELT) {
                        newX = x + 1;
                        shouldMove = true;
                    }
                }
                // ベルトの上のアイテムは条件付きで右に移動
                else if (currentBuilding && currentBuilding.type === BUILDING_TYPES.BELT) {
                    const nextX = x + 1;
                    const nextBuilding = buildingManager.getBuildingAt(nextX, y);
                    
                    if (nextBuilding && (nextBuilding.type === BUILDING_TYPES.BELT || 
                                       nextBuilding.type === BUILDING_TYPES.CHEST)) {
                        newX = nextX;
                        shouldMove = true;
                    }
                }
                // 建物がない場所のアイテムも右に移動を試みる
                else if (!currentBuilding) {
                    newX = x + 1;
                    shouldMove = true;
                }
                
                // 境界チェック
                if (newX >= GAME_CONFIG.GRID_WIDTH) {
                    newX = x;
                    shouldMove = false;
                }
                
                // 移動先をチェック
                if (shouldMove) {
                    const targetBuilding = buildingManager.getBuildingAt(newX, newY);
                    
                    // チェストに到達したアイテムは回収
                    if (targetBuilding && targetBuilding.type === BUILDING_TYPES.CHEST) {
                        if (item.type === 'iron') {
                            collectedItems++;
                        }
                        return; // アイテム消去（回収完了）
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
