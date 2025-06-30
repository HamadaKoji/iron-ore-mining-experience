/**
 * シンプルなテストフレームワーク
 */
export class TestFramework {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * テストを追加
     * @param {string} name - テスト名
     * @param {Function} testFn - テスト関数
     */
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * アサーション: 等価チェック
     * @param {*} actual - 実際の値
     * @param {*} expected - 期待値
     * @param {string} message - エラーメッセージ
     */
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
        }
    }

    /**
     * アサーション: 真偽値チェック
     * @param {*} value - チェックする値
     * @param {string} message - エラーメッセージ
     */
    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`${message} - Expected truthy value, got: ${value}`);
        }
    }

    /**
     * アサーション: 偽値チェック
     * @param {*} value - チェックする値
     * @param {string} message - エラーメッセージ
     */
    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`${message} - Expected falsy value, got: ${value}`);
        }
    }

    /**
     * アサーション: null/undefinedチェック
     * @param {*} value - チェックする値
     * @param {string} message - エラーメッセージ
     */
    assertNotNull(value, message = '') {
        if (value == null) {
            throw new Error(`${message} - Expected non-null value, got: ${value}`);
        }
    }

    /**
     * アサーション: nullチェック
     * @param {*} value - チェックする値
     * @param {string} message - エラーメッセージ
     */
    assertNull(value, message = '') {
        if (value !== null) {
            throw new Error(`${message} - Expected null value, got: ${value}`);
        }
    }

    /**
     * 全テストを実行
     */
    async runAll() {
        console.log('🧪 テスト開始...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFn.call(this);
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.error(`❌ ${test.name}: ${error.message}`);
            }
            this.results.total++;
        }

        this.printResults();
    }

    /**
     * テスト結果を表示
     */
    printResults() {
        console.log('\n📊 テスト結果:');
        console.log(`✅ 成功: ${this.results.passed}`);
        console.log(`❌ 失敗: ${this.results.failed}`);
        console.log(`📈 合計: ${this.results.total}`);
        console.log(`🎯 成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 全テスト成功！');
        } else {
            console.log('\n⚠️  失敗したテストがあります。');
        }
    }
}
