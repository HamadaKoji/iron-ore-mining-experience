import { TestFramework } from './test-framework.js';
import { ItemManager } from '../src/items.js';
import { BuildingManager } from '../src/buildings.js';
import { BUILDING_TYPES, TERRAIN_TYPES, GAME_CONFIG } from '../src/config.js';

const framework = new TestFramework();

// テスト用地形を作成
function createTestTerrain() {
    const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill().map(() => 
        Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS)
    );
    terrain[0][0] = TERRAIN_TYPES.ORE;
    return terrain;
}

framework.test('アイテム追加', function() {
    const itemManager = new ItemManager();
    
    itemManager.addItem(5, 5, 'iron');
    const items = itemManager.getItemsAt(5, 5);
    
    this.assertEqual(items.length, 1, 'アイテムが追加されていない');
    this.assertEqual(items[0].type, 'iron', 'アイテムタイプが正しくない');
});

framework.test('複数アイテム追加', function() {
    const itemManager = new ItemManager();
    
    itemManager.addItem(5, 5, 'iron');
    itemManager.addItem(5, 5, 'iron');
    const items = itemManager.getItemsAt(5, 5);
    
    this.assertEqual(items.length, 2, '複数アイテムが正しく追加されていない');
});

framework.test('アイテム総数カウント', function() {
    const itemManager = new ItemManager();
    
    itemManager.addItem(1, 1, 'iron');
    itemManager.addItem(2, 2, 'iron');
    itemManager.addItem(3, 3, 'iron');
    
    this.assertEqual(itemManager.getTotalItemCount(), 3, 'アイテム総数が正しくない');
});

framework.test('採掘機からベルトへのアイテム移動', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // 採掘機とベルトを設置
    buildingManager.placeBuilding(0, 0, BUILDING_TYPES.MINER, terrain);
    buildingManager.placeBuilding(1, 0, BUILDING_TYPES.BELT, terrain);
    
    // 採掘機にアイテムを追加
    itemManager.addItem(0, 0, 'iron');
    
    // アイテム移動
    itemManager.moveItems(buildingManager);
    
    // 採掘機からアイテムが移動したことを確認
    this.assertEqual(itemManager.getItemsAt(0, 0).length, 0, '採掘機からアイテムが移動していない');
    this.assertEqual(itemManager.getItemsAt(1, 0).length, 1, 'ベルトにアイテムが移動していない');
});

framework.test('採掘機からベルトなしでの移動（停止）', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // 採掘機のみ設置（ベルトなし）
    buildingManager.placeBuilding(0, 0, BUILDING_TYPES.MINER, terrain);
    
    // 採掘機にアイテムを追加
    itemManager.addItem(0, 0, 'iron');
    
    // アイテム移動
    itemManager.moveItems(buildingManager);
    
    // アイテムが移動しないことを確認
    this.assertEqual(itemManager.getItemsAt(0, 0).length, 1, 'ベルトがないのにアイテムが移動した');
});

framework.test('ベルト終端での停止', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // ベルトのみ設置（次にベルトやチェストなし）
    buildingManager.placeBuilding(5, 5, BUILDING_TYPES.BELT, terrain);
    
    // ベルトにアイテムを追加
    itemManager.addItem(5, 5, 'iron');
    
    // アイテム移動
    itemManager.moveItems(buildingManager);
    
    // アイテムがベルト上で停止することを確認
    this.assertEqual(itemManager.getItemsAt(5, 5).length, 1, 'ベルト終端でアイテムが停止していない');
});

framework.test('チェストでのアイテム回収', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // ベルトとチェストを設置
    buildingManager.placeBuilding(5, 5, BUILDING_TYPES.BELT, terrain);
    buildingManager.placeBuilding(6, 5, BUILDING_TYPES.CHEST, terrain);
    
    // ベルトにアイテムを追加
    itemManager.addItem(5, 5, 'iron');
    
    // アイテム移動
    const collectedItems = itemManager.moveItems(buildingManager);
    
    // アイテムが回収されたことを確認
    this.assertEqual(collectedItems, 1, 'アイテムが回収されていない');
    this.assertEqual(itemManager.getItemsAt(6, 5).length, 0, 'チェストにアイテムが残っている');
});

framework.test('ベルト上アイテム数カウント', function() {
    const itemManager = new ItemManager();
    const buildingManager = new BuildingManager();
    const terrain = createTestTerrain();
    
    // ベルトを設置
    buildingManager.placeBuilding(1, 1, BUILDING_TYPES.BELT, terrain);
    buildingManager.placeBuilding(2, 2, BUILDING_TYPES.BELT, terrain);
    
    // アイテムを追加
    itemManager.addItem(1, 1, 'iron');
    itemManager.addItem(2, 2, 'iron');
    itemManager.addItem(3, 3, 'iron'); // ベルト上ではない
    
    const itemsOnBelts = itemManager.getItemsOnBelts(buildingManager);
    this.assertEqual(itemsOnBelts, 2, 'ベルト上のアイテム数が正しくない');
});

export { framework as itemTests };
