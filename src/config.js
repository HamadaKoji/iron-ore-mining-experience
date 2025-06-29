// ゲーム設定
export const GAME_CONFIG = {
    GRID_WIDTH: 25,
    GRID_HEIGHT: 18,
    CELL_SIZE: 32,
    MINING_INTERVAL: 120, // フレーム数（2秒）
    BELT_MOVE_INTERVAL: 30, // フレーム数（0.5秒）
};

// 建物タイプ
export const BUILDING_TYPES = {
    MINER: 'miner',
    BELT: 'belt',
    CHEST: 'chest'
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
    COAL: 'coal'
};

// 建物の表示設定
export const BUILDING_DISPLAY = {
    [BUILDING_TYPES.MINER]: { color: '#666', emoji: '⛏️' },
    [BUILDING_TYPES.BELT]: { color: '#4169E1', emoji: '➡️' },
    [BUILDING_TYPES.CHEST]: { color: '#FFD700', emoji: '📦' }
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
    [RESOURCE_TYPES.COAL]: { color: '#36454F', emoji: '⚫', name: '石炭' }
};
