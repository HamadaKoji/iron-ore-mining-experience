import { TestFramework } from './test-framework.js';
import { TerrainGenerator } from '../src/terrain.js';
import { GAME_CONFIG, TERRAIN_TYPES } from '../src/config.js';

const framework = new TestFramework();

// 地形生成テスト
framework.test('地形生成 - 正しいサイズ', function() {
    const terrain = TerrainGenerator.generateTerrain();
    
    this.assertEqual(terrain.length, GAME_CONFIG.GRID_HEIGHT, '地形の高さが正しくない');
    this.assertEqual(terrain[0].length, GAME_CONFIG.GRID_WIDTH, '地形の幅が正しくない');
});

framework.test('地形生成 - 固定資源数', function() {
    const terrain = TerrainGenerator.generateTerrain();
    const resourceCounts = TerrainGenerator.countResourceAreas(terrain);
    
    this.assertEqual(resourceCounts.iron, 25, '鉄鉱石の数が25個ではない');
    this.assertEqual(resourceCounts.copper, 20, '銅鉱石の数が20個ではない');
    this.assertEqual(resourceCounts.coal, 15, '石炭の数が15個ではない');
});

framework.test('地形生成 - 資源総数', function() {
    const terrain = TerrainGenerator.generateTerrain();
    const oreCount = TerrainGenerator.countOreAreas(terrain);
    
    this.assertEqual(oreCount, 60, '資源の総数が60個ではない');
});

framework.test('地形取得 - 有効な座標', function() {
    const terrain = TerrainGenerator.generateTerrain();
    const terrainType = TerrainGenerator.getTerrainAt(terrain, 0, 0);
    
    this.assertNotNull(terrainType, '座標(0,0)の地形が取得できない');
});

framework.test('地形取得 - 無効な座標', function() {
    const terrain = TerrainGenerator.generateTerrain();
    const terrainType = TerrainGenerator.getTerrainAt(terrain, -1, -1);
    
    this.assertEqual(terrainType, null, '無効な座標でnullが返されない');
});

framework.test('鉱石エリアカウント', function() {
    // 手動で地形を作成
    const terrain = Array(GAME_CONFIG.GRID_HEIGHT).fill().map(() => 
        Array(GAME_CONFIG.GRID_WIDTH).fill(TERRAIN_TYPES.GRASS)
    );
    
    // 3つの鉱石エリアを設定（各種類1つずつ）
    terrain[0][0] = TERRAIN_TYPES.IRON_ORE;
    terrain[1][1] = TERRAIN_TYPES.COPPER_ORE;
    terrain[2][2] = TERRAIN_TYPES.COAL;
    
    const oreCount = TerrainGenerator.countOreAreas(terrain);
    this.assertEqual(oreCount, 3, '鉱石エリアのカウントが正しくない');
});

export { framework as terrainTests };
