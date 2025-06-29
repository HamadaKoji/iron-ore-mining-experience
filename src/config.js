// ゲーム設定
export const GAME_CONFIG = {
    GRID_WIDTH: 20,
    GRID_HEIGHT: 15,
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
    ORE: 'ore'
};

// 建物の表示設定
export const BUILDING_DISPLAY = {
    [BUILDING_TYPES.MINER]: { color: '#666', emoji: '⛏️' },
    [BUILDING_TYPES.BELT]: { color: '#4169E1', emoji: '➡️' },
    [BUILDING_TYPES.CHEST]: { color: '#FFD700', emoji: '📦' }
};
