import { terrainTests } from './terrain.test.js';
import { buildingTests } from './buildings.test.js';
import { itemTests } from './items.test.js';
import { runSmelterTests } from './smelter.test.js';
import { beltDirectionTests } from './belt-directions.test.js';

/**
 * 全テストを実行
 */
async function runAllTests() {
    console.log('🚀 初めての鉄鉱石採掘体験 - テスト実行\n');
    
    console.log('📍 地形生成テスト');
    console.log('='.repeat(50));
    await terrainTests.runAll();
    
    console.log('\n🏗️  建物管理テスト');
    console.log('='.repeat(50));
    await buildingTests.runAll();
    
    console.log('\n📦 アイテム管理テスト');
    console.log('='.repeat(50));
    await itemTests.runAll();
    
    console.log('\n🔥 製錬炉テスト');
    console.log('='.repeat(50));
    const smelterResults = await runSmelterTests();
    
    console.log('\n➡️ ベルト方向テスト');
    console.log('='.repeat(50));
    await beltDirectionTests.runAll();
    
    // 全体の結果
    const totalPassed = terrainTests.results.passed + buildingTests.results.passed + 
                       itemTests.results.passed + smelterResults.passed + beltDirectionTests.results.passed;
    const totalFailed = terrainTests.results.failed + buildingTests.results.failed + 
                       itemTests.results.failed + smelterResults.failed + beltDirectionTests.results.failed;
    const totalTests = terrainTests.results.total + buildingTests.results.total + 
                      itemTests.results.total + smelterResults.total + beltDirectionTests.results.total;
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 全体テスト結果');
    console.log('='.repeat(60));
    console.log(`✅ 成功: ${totalPassed}`);
    console.log(`❌ 失敗: ${totalFailed}`);
    console.log(`📈 合計: ${totalTests}`);
    console.log(`🎯 成功率: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
        console.log('\n🎉 全テスト成功！コードの品質が保証されています。');
    } else {
        console.log('\n⚠️  失敗したテストがあります。修正が必要です。');
        
        // 失敗したテストの詳細を表示
        const frameworks = [
            { name: '地形生成', framework: terrainTests },
            { name: '建物管理', framework: buildingTests },
            { name: 'アイテム管理', framework: itemTests },
            { name: 'ベルト方向', framework: beltDirectionTests }
        ];
        
        frameworks.forEach(({ name, framework }) => {
            if (framework.results && framework.results.failed > 0) {
                console.log(`❌ ${name}: ${framework.results.failed}件の失敗`);
            }
        });
    }
}

// テスト実行
runAllTests().catch(console.error);
