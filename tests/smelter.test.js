import { TestFramework } from './test-framework.js';
import { BuildingManager } from '../src/buildings.js';
import { ItemManager } from '../src/items.js';
import { BUILDING_TYPES, TERRAIN_TYPES, GAME_CONFIG } from '../src/config.js';

export async function runSmelterTests() {
    const test = new TestFramework();
    
    // テスト1: 製錬炉の設置
    test.test('製錬炉の設置 - 草地に設置', () => {
        const buildingManager = new BuildingManager();
        const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill(null).map(() => Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS));
        
        const result = buildingManager.placeBuilding(5, 5, BUILDING_TYPES.SMELTER, terrain);
        test.assertTrue(result, '製錬炉を草地に設置できるべき');
        
        const smelter = buildingManager.getBuildingAt(5, 5);
        test.assertNotNull(smelter, '製錬炉が存在するべき');
        test.assertEqual(smelter.type, BUILDING_TYPES.SMELTER, '建物タイプが製錬炉であるべき');
        test.assertNull(smelter.inputOre, '初期状態で入力鉱石はnullであるべき');
        test.assertNull(smelter.inputCoal, '初期状態で入力石炭はnullであるべき');
        test.assertEqual(smelter.smeltingProgress, 0, '初期状態で製錬進行度は0であるべき');
    });
    
    // テスト2: 製錬炉への資源投入
    test.test('製錬炉への資源投入', () => {
        const buildingManager = new BuildingManager();
        const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill(null).map(() => Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS));
        
        buildingManager.placeBuilding(5, 5, BUILDING_TYPES.SMELTER, terrain);
        const smelter = buildingManager.getBuildingAt(5, 5);
        
        // 鉄鉱石を投入可能かチェック
        test.assertTrue(
            buildingManager.canSmelterReceiveItem(smelter, 'iron'),
            '空の製錬炉は鉄鉱石を受け取れるべき'
        );
        
        // 鉄鉱石を投入
        buildingManager.addItemToSmelter(smelter, 'iron');
        test.assertEqual(smelter.inputOre, 'iron', '鉄鉱石が投入されているべき');
        
        // 石炭を投入可能かチェック
        test.assertTrue(
            buildingManager.canSmelterReceiveItem(smelter, 'coal'),
            '鉱石がある製錬炉は石炭を受け取れるべき'
        );
        
        // 石炭を投入
        buildingManager.addItemToSmelter(smelter, 'coal');
        test.assertEqual(smelter.inputCoal, 'coal', '石炭が投入されているべき');
        
        // 追加の鉄鉱石は投入できない
        test.assertFalse(
            buildingManager.canSmelterReceiveItem(smelter, 'iron'),
            '既に鉱石がある製錬炉は追加の鉱石を受け取れないべき'
        );
    });
    
    // テスト3: 製錬炉の稼働率計算
    test.test('製錬炉の稼働率計算', () => {
        const buildingManager = new BuildingManager();
        const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill(null).map(() => Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS));
        
        // 製錬炉なしの場合
        test.assertEqual(
            buildingManager.getSmelterUtilization(),
            0,
            '製錬炉がない場合、稼働率は0%であるべき'
        );
        
        // 製錬炉を2つ設置
        buildingManager.placeBuilding(5, 5, BUILDING_TYPES.SMELTER, terrain);
        buildingManager.placeBuilding(7, 7, BUILDING_TYPES.SMELTER, terrain);
        
        // 1つを稼働状態にする
        const smelter1 = buildingManager.getBuildingAt(5, 5);
        smelter1.smeltingProgress = 50;
        
        test.assertEqual(
            buildingManager.getSmelterUtilization(),
            50,
            '2つのうち1つが稼働中なら稼働率は50%であるべき'
        );
    });
    
    // テスト4: 鉱石エリアには設置不可
    test.test('製錬炉の設置 - 鉱石エリアに設置不可', () => {
        const buildingManager = new BuildingManager();
        const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill(null).map(() => Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS));
        terrain[5][5] = TERRAIN_TYPES.IRON_ORE;
        
        const result = buildingManager.placeBuilding(5, 5, BUILDING_TYPES.SMELTER, terrain);
        test.assertFalse(result, '製錬炉を鉱石エリアに設置できないべき');
    });
    
    await test.runAll();
    return test.results;
}