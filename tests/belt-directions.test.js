import { TestFramework } from './test-framework.js';
import { BuildingManager } from '../src/buildings.js';
import { ItemManager } from '../src/items.js';
import { BUILDING_TYPES, TERRAIN_TYPES, GAME_CONFIG, DIRECTIONS } from '../src/config.js';

const framework = new TestFramework();

// テスト用地形を作成
function createTestTerrain() {
    const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill().map(() => 
        Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS)
    );
    return terrain;
}

framework.test('ベルト方向 - 右向きベルト', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // 右向きベルトを2つ連続で設置（移動先も必要）
    buildingManager.placeBuilding(5, 5, BUILDING_TYPES.BELT, terrain, DIRECTIONS.RIGHT);
    buildingManager.placeBuilding(6, 5, BUILDING_TYPES.BELT, terrain, DIRECTIONS.RIGHT);
    const belt = buildingManager.getBuildingAt(5, 5);
    
    this.assertEqual(belt.direction, DIRECTIONS.RIGHT, 'ベルトの方向が正しくない');
    
    // アイテムを追加して移動
    itemManager.addItem(5, 5, 'iron');
    itemManager.moveItems(buildingManager);
    
    // 右に移動していることを確認
    this.assertEqual(itemManager.getItemsAt(6, 5).length, 1, 'アイテムが右に移動していない');
});

framework.test('ベルト方向 - 下向きベルト', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // 下向きベルトを2つ連続で設置
    buildingManager.placeBuilding(5, 5, BUILDING_TYPES.BELT, terrain, DIRECTIONS.DOWN);
    buildingManager.placeBuilding(5, 6, BUILDING_TYPES.BELT, terrain, DIRECTIONS.DOWN);
    
    // アイテムを追加して移動
    itemManager.addItem(5, 5, 'iron');
    itemManager.moveItems(buildingManager);
    
    // 下に移動していることを確認
    this.assertEqual(itemManager.getItemsAt(5, 6).length, 1, 'アイテムが下に移動していない');
});

framework.test('ベルト方向 - 左向きベルト', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // 左向きベルトを2つ連続で設置
    buildingManager.placeBuilding(5, 5, BUILDING_TYPES.BELT, terrain, DIRECTIONS.LEFT);
    buildingManager.placeBuilding(4, 5, BUILDING_TYPES.BELT, terrain, DIRECTIONS.LEFT);
    
    // アイテムを追加して移動
    itemManager.addItem(5, 5, 'iron');
    itemManager.moveItems(buildingManager);
    
    // 左に移動していることを確認
    this.assertEqual(itemManager.getItemsAt(4, 5).length, 1, 'アイテムが左に移動していない');
});

framework.test('ベルト方向 - 上向きベルト', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // 上向きベルトを2つ連続で設置
    buildingManager.placeBuilding(5, 5, BUILDING_TYPES.BELT, terrain, DIRECTIONS.UP);
    buildingManager.placeBuilding(5, 4, BUILDING_TYPES.BELT, terrain, DIRECTIONS.UP);
    
    // アイテムを追加して移動
    itemManager.addItem(5, 5, 'iron');
    itemManager.moveItems(buildingManager);
    
    // 上に移動していることを確認
    this.assertEqual(itemManager.getItemsAt(5, 4).length, 1, 'アイテムが上に移動していない');
});

framework.test('採掘機から各方向のベルトへの出力', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // 中央に鉄鉱石を配置
    terrain[10][10] = TERRAIN_TYPES.IRON_ORE;
    
    // 採掘機を設置
    buildingManager.placeBuilding(10, 10, BUILDING_TYPES.MINER, terrain);
    
    // 各方向にベルトを設置
    buildingManager.placeBuilding(11, 10, BUILDING_TYPES.BELT, terrain, DIRECTIONS.RIGHT); // 右
    buildingManager.placeBuilding(10, 11, BUILDING_TYPES.BELT, terrain, DIRECTIONS.DOWN);  // 下
    buildingManager.placeBuilding(9, 10, BUILDING_TYPES.BELT, terrain, DIRECTIONS.LEFT);  // 左
    buildingManager.placeBuilding(10, 9, BUILDING_TYPES.BELT, terrain, DIRECTIONS.UP);    // 上
    
    // 各方向にアイテムを追加
    itemManager.addItem(10, 10, 'iron'); // 採掘機の位置
    itemManager.moveItems(buildingManager);
    
    // いずれかの方向に移動していることを確認
    const rightItems = itemManager.getItemsAt(11, 10).length;
    const downItems = itemManager.getItemsAt(10, 11).length;
    const leftItems = itemManager.getItemsAt(9, 10).length;
    const upItems = itemManager.getItemsAt(10, 9).length;
    const totalMoved = rightItems + downItems + leftItems + upItems;
    
    this.assertEqual(totalMoved, 1, '採掘機からベルトへアイテムが移動していない');
});

export { framework as beltDirectionTests };