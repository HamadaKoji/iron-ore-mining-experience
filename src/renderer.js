import { GAME_CONFIG, TERRAIN_TYPES, BUILDING_DISPLAY } from './config.js';

/**
 * レンダリングクラス
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * 画面をクリア
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 地形を描画
     * @param {Array<Array<string>>} terrain - 地形データ
     */
    renderTerrain(terrain) {
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
                const isOre = terrain[y][x] === TERRAIN_TYPES.ORE;
                const color = isOre ? '#8B4513' : '#90EE90';
                
                // 背景色
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x * GAME_CONFIG.CELL_SIZE, y * GAME_CONFIG.CELL_SIZE, 
                                GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);
                
                // 鉱石エリアに絵文字を表示
                if (isOre) {
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(
                        '🪨',
                        x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
                        y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2
                    );
                }
            }
        }
    }

    /**
     * グリッド線を描画
     */
    renderGrid() {
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        
        // 縦線
        for (let x = 0; x <= GAME_CONFIG.GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * GAME_CONFIG.CELL_SIZE, 0);
            this.ctx.lineTo(x * GAME_CONFIG.CELL_SIZE, GAME_CONFIG.GRID_HEIGHT * GAME_CONFIG.CELL_SIZE);
            this.ctx.stroke();
        }
        
        // 横線
        for (let y = 0; y <= GAME_CONFIG.GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * GAME_CONFIG.CELL_SIZE);
            this.ctx.lineTo(GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.CELL_SIZE, y * GAME_CONFIG.CELL_SIZE);
            this.ctx.stroke();
        }
    }

    /**
     * 建物を描画
     * @param {Map} buildings - 建物マップ
     */
    renderBuildings(buildings) {
        buildings.forEach(building => {
            const display = BUILDING_DISPLAY[building.type];
            
            // 背景色
            this.ctx.fillStyle = display.color;
            this.ctx.fillRect(
                building.x * GAME_CONFIG.CELL_SIZE + 2,
                building.y * GAME_CONFIG.CELL_SIZE + 2,
                GAME_CONFIG.CELL_SIZE - 4,
                GAME_CONFIG.CELL_SIZE - 4
            );
            
            // 絵文字描画
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                display.emoji,
                building.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
                building.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2
            );
        });
    }

    /**
     * アイテムを描画
     * @param {Map} items - アイテムマップ
     */
    renderItems(items) {
        items.forEach(itemList => {
            itemList.forEach(item => {
                // パルス効果のための計算
                const timeSinceCreated = Date.now() - (item.createdTime || Date.now());
                const pulseScale = 1 + 0.2 * Math.sin(timeSinceCreated / 200);
                
                // 背景円を描画
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.beginPath();
                this.ctx.arc(
                    item.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
                    item.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
                    12 * pulseScale,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
                
                // 境界線を追加
                this.ctx.strokeStyle = '#FF4500';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 鉄鉱石の絵文字
                this.ctx.font = `${18 * pulseScale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#000';
                this.ctx.fillText(
                    '🔩',
                    item.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
                    item.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2
                );
            });
        });
    }

    /**
     * ヒントを描画
     * @param {number} buildingCount - 建物総数
     * @param {boolean} hasMiners - 採掘機があるか
     * @param {boolean} hasBelts - ベルトがあるか
     * @param {boolean} hasChests - チェストがあるか
     */
    renderHints(buildingCount, hasMiners, hasBelts, hasChests) {
        // 建物が何もない場合のヒント
        if (buildingCount === 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 300, 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('🎯 まずは茶色の鉱石エリアに', 20, 30);
            this.ctx.fillText('   採掘機を設置してみよう！', 20, 50);
        }
        
        if (hasMiners && !hasBelts && buildingCount < 5) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 80, 280, 40);
            this.ctx.fillStyle = '#4169E1';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('📦 次はベルトで運搬ラインを作ろう！', 20, 105);
        }
        
        if (hasMiners && hasBelts && !hasChests && buildingCount < 10) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 130, 300, 40);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('💰 最後にチェストでアイテムを回収！', 20, 155);
        }
    }
}
