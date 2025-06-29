#!/usr/bin/env node

/**
 * 簡易テストカバレッジチェッカー
 * 実際のカバレッジツールの代替として、テスト対象の関数数をカウント
 */

import fs from 'fs';
import path from 'path';

const srcDir = './src';
const testsDir = './tests';

/**
 * JavaScriptファイルから関数・メソッドを抽出
 */
function extractFunctions(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const functions = [];
    
    // 関数宣言・メソッド定義を検索
    const patterns = [
        /function\s+(\w+)/g,           // function name()
        /(\w+)\s*\(/g,                 // method()
        /static\s+(\w+)\s*\(/g,       // static method()
        /(\w+)\s*=\s*function/g,      // name = function
        /(\w+)\s*=\s*\(/g,            // name = (
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const funcName = match[1];
            if (funcName && !functions.includes(funcName)) {
                functions.push(funcName);
            }
        }
    });
    
    return functions.filter(name => 
        !['constructor', 'if', 'for', 'while', 'switch', 'catch'].includes(name)
    );
}

/**
 * テストファイルからテスト対象の関数を抽出
 */
function extractTestedFunctions(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const testedFunctions = [];
    
    // テスト名から関数名を推測
    const testPattern = /test\(['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = testPattern.exec(content)) !== null) {
        testedFunctions.push(match[1]);
    }
    
    return testedFunctions;
}

/**
 * カバレッジレポート生成
 */
function generateCoverageReport() {
    console.log('🧪 テストカバレッジ分析\n');
    
    const srcFiles = fs.readdirSync(srcDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(srcDir, file));
    
    const testFiles = fs.readdirSync(testsDir)
        .filter(file => file.endsWith('.test.js'))
        .map(file => path.join(testsDir, file));
    
    let totalFunctions = 0;
    let totalTests = 0;
    
    console.log('📁 ソースファイル分析:');
    srcFiles.forEach(filePath => {
        const functions = extractFunctions(filePath);
        const fileName = path.basename(filePath);
        console.log(`  ${fileName}: ${functions.length}個の関数`);
        totalFunctions += functions.length;
    });
    
    console.log('\n🧪 テストファイル分析:');
    testFiles.forEach(filePath => {
        const tests = extractTestedFunctions(filePath);
        const fileName = path.basename(filePath);
        console.log(`  ${fileName}: ${tests.length}個のテスト`);
        totalTests += tests.length;
    });
    
    const estimatedCoverage = totalTests > 0 ? 
        Math.min(100, Math.round((totalTests / totalFunctions) * 100)) : 0;
    
    console.log('\n📊 カバレッジ推定:');
    console.log(`  総関数数: ${totalFunctions}`);
    console.log(`  総テスト数: ${totalTests}`);
    console.log(`  推定カバレッジ: ${estimatedCoverage}%`);
    
    // 目標との比較
    const targetCoverage = 85;
    if (estimatedCoverage >= targetCoverage) {
        console.log(`\n✅ 目標カバレッジ(${targetCoverage}%)を達成しています！`);
    } else {
        const needed = Math.ceil((targetCoverage * totalFunctions / 100) - totalTests);
        console.log(`\n⚠️  目標カバレッジ(${targetCoverage}%)まで約${needed}個のテストが必要です。`);
    }
    
    console.log('\n💡 注意: これは簡易的な推定です。正確なカバレッジには専用ツールを使用してください。');
}

// 実行
try {
    generateCoverageReport();
} catch (error) {
    console.error('❌ カバレッジ分析中にエラーが発生しました:', error.message);
    process.exit(1);
}
