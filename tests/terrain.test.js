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

framework.test('地形生成 - 鉱石確率0%', function() {
    const terrain = TerrainGenerator.generateTerrain({ iron: 0, copper: 0, coal: 0 });
    const oreCount = TerrainGenerator.countOreAreas(terrain);
    
    this.assertEqual(oreCount, 0, '鉱石確率0%なのに鉱石が生成された');
});

framework.test('地形生成 - 鉱石確率100%', function() {
    // 各資源の確率を合計100%になるように設定
    const terrain = TerrainGenerator.generateTerrain({ iron: 0.34, copper: 0.33, coal: 0.33 });
    const oreCount = TerrainGenerator.countOreAreas(terrain);
    const totalCells = GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.GRID_HEIGHT;
    
    this.assertEqual(oreCount, totalCells, '鉱石確率100%なのに全セルが鉱石になっていない');
});

framework.test('地形取得 - 有効な座標', function() {
    const terrain = TerrainGenerator.generateTerrain({ iron: 0, copper: 0, coal: 0 });
    const terrainType = TerrainGenerator.getTerrainAt(terrain, 0, 0);
    
    this.assertEqual(terrainType, TERRAIN_TYPES.GRASS, '座標(0,0)の地形が取得できない');
});

framework.test('地形取得 - 無効な座標', function() {
    const terrain = TerrainGenerator.generateTerrain({ iron: 0, copper: 0, coal: 0 });
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
