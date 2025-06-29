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
     * ヒントをサイドパネルに更新（キャンバス描画なし）
     * @param {number} buildingCount - 建物総数
     * @param {boolean} hasMiners - 採掘機があるか
     * @param {boolean} hasBelts - ベルトがあるか
     * @param {boolean} hasChests - チェストがあるか
     */
    updateHints(buildingCount, hasMiners, hasBelts, hasChests) {
        const hintDisplay = document.getElementById('hint-display');
        const hintMessage = document.getElementById('hint-message');
        
        if (!hintDisplay || !hintMessage) return;
        
        let hintData = null;
        
        // 建物が何もない場合のヒント
        if (buildingCount === 0) {
            hintData = {
                icon: '🎯',
                title: '資源エリアに採掘機を設置してみよう！',
                detail: '🔩鉄鉱石(茶) 🟠銅鉱石(橙) ⚫石炭(黒) - どれでもOK！',
                className: 'hint-start'
            };
        }
        // 採掘機はあるがベルトがない場合
        else if (hasMiners && !hasBelts && buildingCount < 8) {
            hintData = {
                icon: '➡️',
                title: 'ベルトで運搬ラインを作ろう！',
                detail: '採掘機の右側からチェストまでベルトを敷設してください',
                className: 'hint-progress'
            };
        }
        // ベルトはあるがチェストがない場合
        else if (hasMiners && hasBelts && !hasChests) {
            hintData = {
                icon: '📦',
                title: 'チェストでアイテムを回収しよう！',
                detail: 'ベルトの終点にチェストを設置して資源を回収してください',
                className: 'hint-complete'
            };
        }
        // 完成状態
        else if (hasMiners && hasBelts && hasChests) {
            hintData = {
                icon: '🎉',
                title: '素晴らしい！工場が稼働中です',
                detail: '複数の資源ラインを作って生産効率を上げてみましょう！',
                className: 'hint-complete'
            };
        }
        
        // ヒント表示を更新
        if (hintData) {
            hintMessage.innerHTML = `
                <div class="hint-icon">${hintData.icon}</div>
                <div class="hint-text">
                    <div class="hint-title">${hintData.title}</div>
                    <div class="hint-detail">${hintData.detail}</div>
                </div>
            `;
            
            // CSSクラスを更新
            hintDisplay.className = `hint-content ${hintData.className}`;
        }
    }
}
