import { GAME_CONFIG, TERRAIN_TYPES, TERRAIN_DISPLAY, BUILDING_DISPLAY, BUILDING_TYPES, DIRECTION_DISPLAY } from './config.js';

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
                
                // 資源エリアにアイコンを表示
                if (terrainType !== TERRAIN_TYPES.GRASS) {
                    // 資源タイプに応じたアイコンとラベルを取得
                    let resourceEmoji = '🪨';
                    let resourceLabel = '';
                    let labelColor = '#000';
                    
                    if (terrainType === TERRAIN_TYPES.IRON_ORE) {
                        resourceEmoji = '🔩';
                        resourceLabel = '鉄';
                        labelColor = '#8B4513';
                    } else if (terrainType === TERRAIN_TYPES.COPPER_ORE) {
                        resourceEmoji = '🟠';
                        resourceLabel = '銅';
                        labelColor = '#CD853F';
                    } else if (terrainType === TERRAIN_TYPES.COAL) {
                        resourceEmoji = '⚫';
                        resourceLabel = '炭';
                        labelColor = '#2F2F2F';
                    }
                    
                    // エリアの境界線を描画
                    this.ctx.strokeStyle = labelColor;
                    this.ctx.lineWidth = 2;
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.strokeRect(
                        x * GAME_CONFIG.CELL_SIZE + 1,
                        y * GAME_CONFIG.CELL_SIZE + 1,
                        GAME_CONFIG.CELL_SIZE - 2,
                        GAME_CONFIG.CELL_SIZE - 2
                    );
                    this.ctx.globalAlpha = 1.0;
                    
                    // アイコンを描画（左側のセルのみ）
                    if (x === 0 || terrain[y][x-1] !== terrainType) {
                        // 半透明の白背景
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        this.ctx.fillRect(
                            x * GAME_CONFIG.CELL_SIZE + 2,
                            y * GAME_CONFIG.CELL_SIZE + 2,
                            20,
                            20
                        );
                        
                        // アイコン
                        this.ctx.font = '14px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillStyle = '#000';
                        this.ctx.fillText(
                            resourceEmoji,
                            x * GAME_CONFIG.CELL_SIZE + 12,
                            y * GAME_CONFIG.CELL_SIZE + 12
                        );
                    }
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
            
            // ベルトの場合は方向に応じた絵文字を表示
            let emoji = display.emoji;
            if (building.type === BUILDING_TYPES.BELT && building.direction) {
                emoji = DIRECTION_DISPLAY[building.direction] || display.emoji;
            }
            
            this.ctx.fillText(
                emoji,
                building.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
                building.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2
            );
            
            // 製錬炉の追加表示
            if (building.type === 'smelter') {
                // 製錬進行状況バー
                if (building.smeltingProgress > 0) {
                    const progress = building.smeltingProgress / GAME_CONFIG.SMELTING_TIME;
                    const barWidth = (GAME_CONFIG.CELL_SIZE - 8) * progress;
                    
                    // 背景バー
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.fillRect(
                        building.x * GAME_CONFIG.CELL_SIZE + 4,
                        building.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE - 8,
                        GAME_CONFIG.CELL_SIZE - 8,
                        4
                    );
                    
                    // 進行バー
                    this.ctx.fillStyle = '#FFA500';
                    this.ctx.fillRect(
                        building.x * GAME_CONFIG.CELL_SIZE + 4,
                        building.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE - 8,
                        barWidth,
                        4
                    );
                }
                
                // 燃料状態表示
                if (!building.inputCoal && !building.smeltingProgress) {
                    // 燃料なし表示（グレーアウト）
                    this.ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
                    this.ctx.fillRect(
                        building.x * GAME_CONFIG.CELL_SIZE + 2,
                        building.y * GAME_CONFIG.CELL_SIZE + 2,
                        GAME_CONFIG.CELL_SIZE - 4,
                        GAME_CONFIG.CELL_SIZE - 4
                    );
                }
            }
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
                    case 'iron_plate':
                        itemColor = '#4682B4';
                        itemEmoji = '🟦';
                        break;
                    case 'copper_plate':
                        itemColor = '#FF8C00';
                        itemEmoji = '🟧';
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
     * @param {boolean} hasSmelters - 製錬炉があるか
     * @param {number} metalPlateCount - 金属板の総数
     */
    updateHints(buildingCount, hasMiners, hasBelts, hasSmelters, metalPlateCount) {
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
                detail: '採掘機の右側から製錬炉までベルトを敷設してください',
                className: 'hint-progress'
            };
        }
        // 製錬炉がまだない場合
        else if (hasMiners && hasBelts && !hasSmelters) {
            hintData = {
                icon: '🔥',
                title: '製錬炉で金属板を作ってみよう！',
                detail: '石炭を採掘して、鉱石と一緒に製錬炉へ運びましょう',
                className: 'hint-progress'
            };
        }
        // 製錬炉はあるが金属板がまだない場合
        else if (hasSmelters && metalPlateCount === 0) {
            hintData = {
                icon: '⚡',
                title: '製錬炉に材料を供給しよう！',
                detail: '鉱石と石炭の両方が必要です。石炭の採掘も忘れずに！',
                className: 'hint-progress'
            };
        }
        // 完成状態
        else if (hasMiners && hasBelts && hasSmelters && metalPlateCount > 0) {
            hintData = {
                icon: '🎉',
                title: '素晴らしい！完全な工場が稼働中です',
                detail: '金属板の生産効率を上げて、より高度な工場を目指しましょう！',
                className: 'hint-complete'
            };
        }
        
        // ヒント表示を更新
        if (hintData) {
            const newContent = `
                <div class="hint-icon">${hintData.icon}</div>
                <div class="hint-text">
                    <div class="hint-title">${hintData.title}</div>
                    <div class="hint-detail">${hintData.detail}</div>
                </div>
            `;
            
            // 内容が変わった場合のみアニメーション
            if (hintMessage.innerHTML.trim() !== newContent.trim()) {
                const hintContainer = document.querySelector('.hint-container');
                
                // フェードアウト
                hintContainer.style.animation = 'fadeOut 0.3s ease-out';
                
                setTimeout(() => {
                    hintMessage.innerHTML = newContent;
                    hintDisplay.className = `hint-content ${hintData.className}`;
                    // フェードイン
                    hintContainer.style.animation = 'fadeIn 0.5s ease-out';
                }, 300);
            } else {
                // 内容が同じ場合はクラスのみ更新
                hintDisplay.className = `hint-content ${hintData.className}`;
            }
        }
    }
}
