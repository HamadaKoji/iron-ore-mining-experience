import { GAME_CONFIG, TERRAIN_TYPES, TERRAIN_DISPLAY, BUILDING_DISPLAY } from './config.js';

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
     * 地形を描画（複数資源対応）
     * @param {Array<Array<string>>} terrain - 地形データ
     */
    renderTerrain(terrain) {
        for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
                const terrainType = terrain[y][x];
                const terrainConfig = TERRAIN_DISPLAY[terrainType];
                
                // デフォルト値（設定が見つからない場合）
                const color = terrainConfig ? terrainConfig.color : '#90EE90';
                const emoji = terrainConfig ? terrainConfig.emoji : '🌱';
                
                // 背景色
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x * GAME_CONFIG.CELL_SIZE, y * GAME_CONFIG.CELL_SIZE, 
                                GAME_CONFIG.CELL_SIZE, GAME_CONFIG.CELL_SIZE);
                
                // 資源エリアに絵文字を表示
                if (terrainType !== TERRAIN_TYPES.GRASS) {
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(
                        emoji,
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
     * アイテムを描画（複数資源対応）
     * @param {Map} items - アイテムマップ
     */
    renderItems(items) {
        items.forEach(itemList => {
            itemList.forEach(item => {
                // パルス効果のための計算
                const timeSinceCreated = Date.now() - (item.createdTime || Date.now());
                const pulseScale = 1 + 0.2 * Math.sin(timeSinceCreated / 200);
                
                // 資源タイプに応じた色と絵文字を取得
                let itemColor = '#FF4500'; // デフォルト（鉄）
                let itemEmoji = '🔩'; // デフォルト（鉄）
                
                switch (item.type) {
                    case 'iron':
                        itemColor = '#FF4500';
                        itemEmoji = '🔩';
                        break;
                    case 'copper':
                        itemColor = '#B87333';
                        itemEmoji = '🟠';
                        break;
                    case 'coal':
                        itemColor = '#36454F';
                        itemEmoji = '⚫';
                        break;
                }
                
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
                
                // 境界線を追加（資源タイプ別の色）
                this.ctx.strokeStyle = itemColor;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 資源の絵文字
                this.ctx.font = `${18 * pulseScale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#000';
                this.ctx.fillText(
                    itemEmoji,
                    item.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
                    item.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2
                );
            });
        });
    }

    /**
     * ヒントを描画（改善版）
     * @param {number} buildingCount - 建物総数
     * @param {boolean} hasMiners - 採掘機があるか
     * @param {boolean} hasBelts - ベルトがあるか
     * @param {boolean} hasChests - チェストがあるか
     */
    renderHints(buildingCount, hasMiners, hasBelts, hasChests) {
        const hintY = GAME_CONFIG.GRID_HEIGHT * GAME_CONFIG.CELL_SIZE - 80; // 画面下部に配置
        
        // 建物が何もない場合のヒント
        if (buildingCount === 0) {
            this.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
            this.ctx.fillRect(10, hintY, 350, 60);
            
            // 境界線
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(10, hintY, 350, 60);
            
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText('🎯 資源エリアに採掘機を設置してみよう！', 20, hintY + 25);
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.fillText('🔩鉄鉱石(茶) 🟠銅鉱石(橙) ⚫石炭(黒) - どれでもOK！', 20, hintY + 45);
        }
        
        // 採掘機はあるがベルトがない場合
        else if (hasMiners && !hasBelts && buildingCount < 8) {
            this.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
            this.ctx.fillRect(10, hintY, 320, 40);
            
            this.ctx.strokeStyle = '#27ae60';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(10, hintY, 320, 40);
            
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText('➡️ ベルトで運搬ラインを作ろう！', 20, hintY + 25);
        }
        
        // ベルトはあるがチェストがない場合
        else if (hasMiners && hasBelts && !hasChests) {
            this.ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
            this.ctx.fillRect(10, hintY, 300, 40);
            
            this.ctx.strokeStyle = '#f39c12';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(10, hintY, 300, 40);
            
            this.ctx.fillStyle = '#ecf0f1';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText('📦 チェストでアイテムを回収しよう！', 20, hintY + 25);
        }
    }
}
