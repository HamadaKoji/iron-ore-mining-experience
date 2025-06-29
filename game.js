// ゲーム設定
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;
const CELL_SIZE = 32;

// 建物タイプ
const BUILDING_TYPES = {
    MINER: 'miner',
    BELT: 'belt',
    CHEST: 'chest'
};

// 地形タイプ
const TERRAIN_TYPES = {
    GRASS: 'grass',
    ORE: 'ore'
};

// ゲーム状態
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.selectedTool = BUILDING_TYPES.MINER;
        this.ironCount = 0;
        
        // マップ初期化
        this.terrain = this.generateTerrain();
        this.buildings = new Map(); // "x,y" -> building object
        this.items = new Map(); // "x,y" -> item array
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    // 地形生成
    generateTerrain() {
        const terrain = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            terrain[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                // ランダムに鉱脈を配置（20%の確率）
                terrain[y][x] = Math.random() < 0.2 ? TERRAIN_TYPES.ORE : TERRAIN_TYPES.GRASS;
            }
        }
        return terrain;
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // 建物選択ボタン
        document.getElementById('miner-btn').addEventListener('click', () => this.selectTool(BUILDING_TYPES.MINER));
        document.getElementById('belt-btn').addEventListener('click', () => this.selectTool(BUILDING_TYPES.BELT));
        document.getElementById('chest-btn').addEventListener('click', () => this.selectTool(BUILDING_TYPES.CHEST));
        
        // キャンバスクリック
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }
    
    // ツール選択
    selectTool(tool) {
        this.selectedTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + '-btn').classList.add('active');
    }
    
    // 座標変換
    getGridPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((clientY - rect.top) / CELL_SIZE);
        return { x, y };
    }
    
    // クリック処理
    handleClick(e) {
        const { x, y } = this.getGridPosition(e.clientX, e.clientY);
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            this.placeBuilding(x, y);
        }
    }
    
    // 右クリック処理
    handleRightClick(e) {
        const { x, y } = this.getGridPosition(e.clientX, e.clientY);
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
            this.removeBuilding(x, y);
        }
    }
    
    // 建物設置
    placeBuilding(x, y) {
        const key = `${x},${y}`;
        if (this.buildings.has(key)) return; // 既に建物がある
        
        const building = {
            type: this.selectedTool,
            x: x,
            y: y,
            timer: 0
        };
        
        // 採掘機は鉱石の上にのみ設置可能
        if (this.selectedTool === BUILDING_TYPES.MINER && this.terrain[y][x] !== TERRAIN_TYPES.ORE) {
            return;
        }
        
        this.buildings.set(key, building);
    }
    
    // 建物削除
    removeBuilding(x, y) {
        const key = `${x},${y}`;
        this.buildings.delete(key);
    }
    
    // ゲーム更新
    update() {
        // 採掘機の処理
        this.buildings.forEach(building => {
            if (building.type === BUILDING_TYPES.MINER) {
                building.timer++;
                if (building.timer >= 120) { // 2秒で採掘（速度を半分に）
                    building.timer = 0;
                    this.addItem(building.x, building.y, 'iron');
                }
            }
        });
        
        // ベルトの処理（30フレームに1回 = 0.5秒に1回移動）
        this.frameCounter = (this.frameCounter || 0) + 1;
        if (this.frameCounter >= 30) {
            this.frameCounter = 0;
            this.moveItems();
        }
        
        // UI更新
        document.getElementById('iron-count').textContent = this.ironCount;
        
        // デバッグ情報更新
        this.updateDebugInfo();
    }
    
    // デバッグ情報更新
    updateDebugInfo() {
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            const totalItems = Array.from(this.items.values()).reduce((sum, itemList) => sum + itemList.length, 0);
            const minerCount = Array.from(this.buildings.values()).filter(b => b.type === BUILDING_TYPES.MINER).length;
            const beltCount = Array.from(this.buildings.values()).filter(b => b.type === BUILDING_TYPES.BELT).length;
            const chestCount = Array.from(this.buildings.values()).filter(b => b.type === BUILDING_TYPES.CHEST).length;
            
            // ベルト上のアイテム数をカウント
            let itemsOnBelts = 0;
            this.items.forEach((itemList, key) => {
                const building = this.buildings.get(key);
                if (building && building.type === BUILDING_TYPES.BELT) {
                    itemsOnBelts += itemList.length;
                }
            });
            
            debugElement.innerHTML = `
                建物: 採掘機${minerCount}個, ベルト${beltCount}個, チェスト${chestCount}個<br>
                マップ上のアイテム: ${totalItems}個 (ベルト上: ${itemsOnBelts}個)
            `;
        }
    }
    
    // アイテム追加
    addItem(x, y, type) {
        const key = `${x},${y}`;
        if (!this.items.has(key)) {
            this.items.set(key, []);
        }
        this.items.get(key).push({ 
            type: type, 
            x: x, 
            y: y,
            createdTime: Date.now() // アニメーション用のタイムスタンプ
        });
    }
    
    // アイテム移動
    moveItems() {
        const newItems = new Map();
        
        this.items.forEach((itemList, key) => {
            const [x, y] = key.split(',').map(Number);
            const currentBuilding = this.buildings.get(key);
            
            itemList.forEach(item => {
                let newX = x, newY = y;
                let shouldMove = false;
                
                // 採掘機の上のアイテムは、隣がベルトの場合のみ移動
                if (currentBuilding && currentBuilding.type === BUILDING_TYPES.MINER) {
                    const rightKey = `${x + 1},${y}`;
                    const rightBuilding = this.buildings.get(rightKey);
                    // 右隣がベルトの場合のみ移動
                    if (rightBuilding && rightBuilding.type === BUILDING_TYPES.BELT) {
                        newX = x + 1;
                        shouldMove = true;
                    }
                }
                // ベルトの上のアイテムは条件付きで右に移動
                else if (currentBuilding && currentBuilding.type === BUILDING_TYPES.BELT) {
                    const nextX = x + 1;
                    const nextKey = `${nextX},${y}`;
                    const nextBuilding = this.buildings.get(nextKey);
                    
                    // 次の位置がベルトまたはチェストの場合のみ移動
                    if (nextBuilding && (nextBuilding.type === BUILDING_TYPES.BELT || nextBuilding.type === BUILDING_TYPES.CHEST)) {
                        newX = nextX;
                        shouldMove = true;
                    }
                    // 次の位置に何もない場合は現在位置に留まる（ベルトの終端で停止）
                    // shouldMove = false のまま（デフォルト）
                }
                // 建物がない場所のアイテムも右に移動を試みる（既にベルトから出たアイテム）
                else if (!currentBuilding) {
                    newX = x + 1;
                    shouldMove = true;
                }
                
                // 境界チェック
                if (newX >= GRID_WIDTH) {
                    newX = x;
                    shouldMove = false;
                }
                
                // 移動先をチェック
                if (shouldMove) {
                    const targetKey = `${newX},${newY}`;
                    const targetBuilding = this.buildings.get(targetKey);
                    
                    // チェストに到達したアイテムは回収
                    if (targetBuilding && targetBuilding.type === BUILDING_TYPES.CHEST) {
                        if (item.type === 'iron') {
                            this.ironCount++;
                        }
                        return; // アイテム消去（回収完了）
                    }
                }
                
                // 移動しない場合は元の位置に留まる
                const finalKey = `${newX},${newY}`;
                if (!newItems.has(finalKey)) {
                    newItems.set(finalKey, []);
                }
                newItems.get(finalKey).push({ 
                    ...item, 
                    x: newX, 
                    y: newY,
                    createdTime: item.createdTime || Date.now()
                });
            });
        });
        
        this.items = newItems;
    }
    
    // 描画
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 地形描画
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const isOre = this.terrain[y][x] === TERRAIN_TYPES.ORE;
                const color = isOre ? '#8B4513' : '#90EE90';
                
                // 背景色
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // 鉱石エリアに絵文字を表示
                if (isOre) {
                    this.ctx.font = '16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(
                        '🪨',
                        x * CELL_SIZE + CELL_SIZE / 2,
                        y * CELL_SIZE + CELL_SIZE / 2
                    );
                }
            }
        }
        
        // グリッド線
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CELL_SIZE, 0);
            this.ctx.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CELL_SIZE);
            this.ctx.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
            this.ctx.stroke();
        }
        
        // 建物描画
        this.buildings.forEach(building => {
            let color, emoji;
            switch (building.type) {
                case BUILDING_TYPES.MINER: 
                    color = '#666'; 
                    emoji = '⛏️';
                    break;
                case BUILDING_TYPES.BELT: 
                    color = '#4169E1'; 
                    emoji = '➡️';
                    break;
                case BUILDING_TYPES.CHEST: 
                    color = '#FFD700'; 
                    emoji = '📦';
                    break;
            }
            
            // 背景色
            this.ctx.fillStyle = color;
            this.ctx.fillRect(
                building.x * CELL_SIZE + 2,
                building.y * CELL_SIZE + 2,
                CELL_SIZE - 4,
                CELL_SIZE - 4
            );
            
            // 絵文字描画
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                emoji,
                building.x * CELL_SIZE + CELL_SIZE / 2,
                building.y * CELL_SIZE + CELL_SIZE / 2
            );
        });
        
        // アイテム描画
        this.items.forEach(itemList => {
            itemList.forEach(item => {
                // パルス効果のための計算
                const timeSinceCreated = Date.now() - (item.createdTime || Date.now());
                const pulseScale = 1 + 0.2 * Math.sin(timeSinceCreated / 200);
                
                // 背景円を描画（アイテムを目立たせる）
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.beginPath();
                this.ctx.arc(
                    item.x * CELL_SIZE + CELL_SIZE / 2,
                    item.y * CELL_SIZE + CELL_SIZE / 2,
                    12 * pulseScale,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
                
                // 境界線を追加
                this.ctx.strokeStyle = '#FF4500';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 鉄鉱石の絵文字（大きめに表示）
                this.ctx.font = `${18 * pulseScale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#000';
                this.ctx.fillText(
                    '🔩',
                    item.x * CELL_SIZE + CELL_SIZE / 2,
                    item.y * CELL_SIZE + CELL_SIZE / 2
                );
            });
        });
        
        // 初心者向けヒント表示
        this.renderHints();
    }
    
    // ヒント表示
    renderHints() {
        // 建物が何もない場合のヒント
        if (this.buildings.size === 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 10, 300, 60);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('🎯 まずは茶色の鉱石エリアに', 20, 30);
            this.ctx.fillText('   採掘機を設置してみよう！', 20, 50);
        }
        
        // 採掘機はあるがベルトがない場合
        const hasMiners = Array.from(this.buildings.values()).some(b => b.type === BUILDING_TYPES.MINER);
        const hasBelts = Array.from(this.buildings.values()).some(b => b.type === BUILDING_TYPES.BELT);
        const hasChests = Array.from(this.buildings.values()).some(b => b.type === BUILDING_TYPES.CHEST);
        
        if (hasMiners && !hasBelts && this.buildings.size < 5) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 80, 280, 40);
            this.ctx.fillStyle = '#4169E1';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('📦 次はベルトで運搬ラインを作ろう！', 20, 105);
        }
        
        if (hasMiners && hasBelts && !hasChests && this.buildings.size < 10) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 130, 300, 40);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('💰 最後にチェストでアイテムを回収！', 20, 155);
        }
    }
    
    // ゲームループ
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    new Game();
});
