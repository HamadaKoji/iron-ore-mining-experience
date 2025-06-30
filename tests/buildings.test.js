import { TestFramework } from './test-framework.js';
import { BuildingManager } from '../src/buildings.js';
import { BUILDING_TYPES, TERRAIN_TYPES, GAME_CONFIG } from '../src/config.js';

const framework = new TestFramework();

// テスト用地形を作成
function createTestTerrain() {
    const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill().map(() => 
        Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS)
    );
    // (0,0)を鉄鉱石エリアに設定
    terrain[0][0] = TERRAIN_TYPES.IRON_ORE;
    return terrain;
}

framework.test('建物設置 - 採掘機を鉱石エリアに設置', function() {
    const manager = new BuildingManager();
    const terrain = createTestTerrain();
    
    const result = manager.placeBuilding(0, 0, BUILDING_TYPES.MINER, terrain);
    
    this.assertTrue(result, '採掘機の設置に失敗');
    this.assertNotNull(manager.getBuildingAt(0, 0), '設置した採掘機が取得できない');
});

framework.test('建物設置 - 採掘機を草地に設置（失敗）', function() {
    const manager = new BuildingManager();
    const terrain = createTestTerrain();
    
    const result = manager.placeBuilding(1, 1, BUILDING_TYPES.MINER, terrain);
    
    this.assertFalse(result, '採掘機が草地に設置できてしまった');
    this.assertEqual(manager.getBuildingAt(1, 1), undefined, '設置されるべきでない建物が存在する');
});

framework.test('建物設置 - ベルトを任意の場所に設置', function() {
    const manager = new BuildingManager();
    const terrain = createTestTerrain();
    
    const result = manager.placeBuilding(5, 5, BUILDING_TYPES.BELT, terrain);
    
    this.assertTrue(result, 'ベルトの設置に失敗');
    this.assertNotNull(manager.getBuildingAt(5, 5), '設置したベルトが取得できない');
});

framework.test('建物設置 - 同じ場所に重複設置（失敗）', function() {
    const manager = new BuildingManager();
    const terrain = createTestTerrain();
    
    manager.placeBuilding(0, 0, BUILDING_TYPES.MINER, terrain);
    const result = manager.placeBuilding(0, 0, BUILDING_TYPES.BELT, terrain);
    
    this.assertFalse(result, '同じ場所に重複して建物が設置できてしまった');
});

framework.test('建物削除', function() {
    const manager = new BuildingManager();
    const terrain = createTestTerrain();
    
    manager.placeBuilding(0, 0, BUILDING_TYPES.MINER, terrain);
    const result = manager.removeBuilding(0, 0);
    
    this.assertTrue(result, '建物の削除に失敗');
    this.assertEqual(manager.getBuildingAt(0, 0), undefined, '削除した建物がまだ存在する');
});

framework.test('建物カウント', function() {
    const manager = new BuildingManager();
    const terrain = createTestTerrain();
    
    manager.placeBuilding(0, 0, BUILDING_TYPES.MINER, terrain);
    manager.placeBuilding(1, 1, BUILDING_TYPES.BELT, terrain);
    manager.placeBuilding(2, 2, BUILDING_TYPES.BELT, terrain);
    
    this.assertEqual(manager.getBuildingCount(BUILDING_TYPES.MINER), 1, '採掘機の数が正しくない');
    this.assertEqual(manager.getBuildingCount(BUILDING_TYPES.BELT), 2, 'ベルトの数が正しくない');
});

framework.test('全建物クリア', function() {
    const manager = new BuildingManager();
    const terrain = createTestTerrain();
    
    manager.placeBuilding(0, 0, BUILDING_TYPES.MINER, terrain);
    manager.placeBuilding(1, 1, BUILDING_TYPES.BELT, terrain);
    manager.clear();
    
    this.assertEqual(manager.getAllBuildings().size, 0, 'クリア後に建物が残っている');
});

export { framework as buildingTests };
