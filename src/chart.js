/**
 * 生産グラフ管理クラス
 */
export class ProductionChart {
    constructor(canvasId, maxDataPoints = 60) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.maxDataPoints = maxDataPoints; // 60秒分のデータ
        
        // データ配列の初期化
        this.data = {
            iron_plate: new Array(maxDataPoints).fill(0),
            copper_plate: new Array(maxDataPoints).fill(0)
        };
        
        // グラフの設定
        this.config = {
            padding: 20,
            gridLines: 5,
            colors: {
                iron_plate: '#4682B4',
                copper_plate: '#FF8C00'
            }
        };
        
        // Canvasのサイズを設定
        this.setupCanvas();
    }
    
    /**
     * Canvasのサイズと解像度を設定
     */
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // 高解像度ディスプレイ対応
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // スケーリング
        this.ctx.scale(dpr, dpr);
        
        // 実際の描画サイズ
        this.width = rect.width;
        this.height = rect.height;
    }
    
    /**
     * データを更新
     * @param {number} ironPlateRate - 鉄板の生産レート（個/分）
     * @param {number} copperPlateRate - 銅板の生産レート（個/分）
     */
    updateData(ironPlateRate, copperPlateRate) {
        // 古いデータを削除して新しいデータを追加
        this.data.iron_plate.shift();
        this.data.iron_plate.push(ironPlateRate);
        
        this.data.copper_plate.shift();
        this.data.copper_plate.push(copperPlateRate);
        
        // グラフを再描画
        this.draw();
    }
    
    /**
     * グラフを描画
     */
    draw() {
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // グリッドとラベルを描画
        this.drawGrid();
        
        // データラインを描画
        this.drawLine(this.data.iron_plate, this.config.colors.iron_plate);
        this.drawLine(this.data.copper_plate, this.config.colors.copper_plate);
    }
    
    /**
     * グリッドとラベルを描画
     */
    drawGrid() {
        const { padding } = this.config;
        const graphWidth = this.width - padding * 2;
        const graphHeight = this.height - padding * 2;
        
        // グリッドラインのスタイル
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 水平グリッドライン
        for (let i = 0; i <= this.config.gridLines; i++) {
            const y = padding + (graphHeight / this.config.gridLines) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(this.width - padding, y);
            this.ctx.stroke();
            
            // Y軸ラベル（生産レート）
            if (i < this.config.gridLines) {
                const value = Math.round((this.config.gridLines - i) * 20); // 最大100個/分
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(value.toString(), padding - 5, y + 3);
            }
        }
        
        // 垂直グリッドライン（時間軸）
        const timeInterval = 10; // 10秒ごと
        for (let i = 0; i < this.maxDataPoints; i += timeInterval) {
            const x = padding + (graphWidth / (this.maxDataPoints - 1)) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding);
            this.ctx.lineTo(x, this.height - padding);
            this.ctx.stroke();
            
            // X軸ラベル（時間）
            const seconds = this.maxDataPoints - i;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${seconds}s`, x, this.height - padding + 15);
        }
    }
    
    /**
     * データラインを描画
     * @param {Array} data - データ配列
     * @param {string} color - 線の色
     */
    drawLine(data, color) {
        const { padding } = this.config;
        const graphWidth = this.width - padding * 2;
        const graphHeight = this.height - padding * 2;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (graphWidth / (this.maxDataPoints - 1)) * index;
            const y = padding + graphHeight - (value / 100) * graphHeight; // 100個/分を最大値として正規化
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // 最新の値に点を描画
        const lastIndex = data.length - 1;
        const lastX = padding + (graphWidth / (this.maxDataPoints - 1)) * lastIndex;
        const lastY = padding + graphHeight - (data[lastIndex] / 100) * graphHeight;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
}