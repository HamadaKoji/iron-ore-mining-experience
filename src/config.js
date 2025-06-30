// ゲーム設定
export const GAME_CONFIG = {
    GRID_WIDTH: 20,
    GRID_HEIGHT: 23,
    CELL_SIZE: 26,  // 525 / 20 ≈ 26, 600 / 23 ≈ 26
    MINING_INTERVAL: 120, // フレーム数（2秒）
    BELT_MOVE_INTERVAL: 30, // フレーム数（0.5秒）
    SMELTING_TIME: 240, // フレーム数（4秒）
};

// 建物タイプ
export const BUILDING_TYPES = {
    MINER: 'miner',
    BELT: 'belt',
    SMELTER: 'smelter'
};

// ベルトの方向
export const DIRECTIONS = {
    RIGHT: 'right',
    DOWN: 'down',
    LEFT: 'left',
    UP: 'up'
};

// 地形タイプ
export const TERRAIN_TYPES = {
    GRASS: 'grass',
    IRON_ORE: 'iron_ore',
    COPPER_ORE: 'copper_ore',
    COAL: 'coal'
};

// 資源タイプ
export const RESOURCE_TYPES = {
    IRON: 'iron',
    COPPER: 'copper',
    COAL: 'coal',
    IRON_PLATE: 'iron_plate',
    COPPER_PLATE: 'copper_plate'
};

// 建物の表示設定
export const BUILDING_DISPLAY = {
    [BUILDING_TYPES.MINER]: { color: '#666', emoji: '⛏️' },
    [BUILDING_TYPES.BELT]: { color: '#4169E1', emoji: '➡️' },
    [BUILDING_TYPES.SMELTER]: { color: '#d97706', emoji: '🔥' }
};

// 方向別の表示設定
export const DIRECTION_DISPLAY = {
    [DIRECTIONS.RIGHT]: '➡️',
    [DIRECTIONS.DOWN]: '⬇️',
    [DIRECTIONS.LEFT]: '⬅️',
    [DIRECTIONS.UP]: '⬆️'
};

// 地形の表示設定
export const TERRAIN_DISPLAY = {
    [TERRAIN_TYPES.GRASS]: { color: '#90EE90', emoji: '🌱' },
    [TERRAIN_TYPES.IRON_ORE]: { color: '#8B4513', emoji: '🪨' },
    [TERRAIN_TYPES.COPPER_ORE]: { color: '#CD853F', emoji: '🟫' },
    [TERRAIN_TYPES.COAL]: { color: '#2F2F2F', emoji: '⚫' }
};

// 資源の表示設定
export const RESOURCE_DISPLAY = {
    [RESOURCE_TYPES.IRON]: { color: '#708090', emoji: '🔩', name: '鉄鉱石' },
    [RESOURCE_TYPES.COPPER]: { color: '#B87333', emoji: '🟠', name: '銅鉱石' },
    [RESOURCE_TYPES.COAL]: { color: '#36454F', emoji: '⚫', name: '石炭' },
    [RESOURCE_TYPES.IRON_PLATE]: { color: '#4682B4', emoji: '🟦', name: '鉄板' },
    [RESOURCE_TYPES.COPPER_PLATE]: { color: '#FF8C00', emoji: '🟧', name: '銅板' }
};
