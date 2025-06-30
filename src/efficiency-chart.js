/**
 * ベルト効率グラフ管理クラス
 */
export class EfficiencyChart {
    constructor(canvasId, maxDataPoints = 20) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.maxDataPoints = maxDataPoints; // 20点 × 15秒 = 5分間のデータ
        
        // データ配列の初期化
        this.data = new Array(maxDataPoints).fill(0);
        
        // グラフの設定
        this.config = {
            padding: 15,
            gridLines: 4,
            color: '#f39c12'
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
     * @param {number} efficiency - ベルト効率値
     */
    updateData(efficiency) {
        // 古いデータを削除して新しいデータを追加
        this.data.shift();
        this.data.push(efficiency);
        
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
        this.drawLine();
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
            
            // Y軸ラベル（効率値）
            if (i < this.config.gridLines) {
                const value = (this.config.gridLines - i) * 1.0; // 最大4.0
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(value.toFixed(1), padding - 5, y + 3);
            }
        }
        
        // 時間軸のマーカー（5点ごと = 75秒ごと）
        for (let i = 0; i < this.maxDataPoints; i += 5) {
            const x = padding + (graphWidth / (this.maxDataPoints - 1)) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.height - padding);
            this.ctx.lineTo(x, this.height - padding + 5);
            this.ctx.stroke();
            
            // X軸ラベル（時間）
            const minutes = (this.maxDataPoints - i) * 15 / 60;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '9px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${minutes}分前`, x, this.height - padding + 15);
        }
    }
    
    /**
     * データラインを描画
     */
    drawLine() {
        const { padding, color } = this.config;
        const graphWidth = this.width - padding * 2;
        const graphHeight = this.height - padding * 2;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        this.data.forEach((value, index) => {
            const x = padding + (graphWidth / (this.maxDataPoints - 1)) * index;
            const y = padding + graphHeight - (value / 4.0) * graphHeight; // 4.0を最大値として正規化
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // 最新の値に点を描画
        const lastIndex = this.data.length - 1;
        const lastX = padding + (graphWidth / (this.maxDataPoints - 1)) * lastIndex;
        const lastY = padding + graphHeight - (this.data[lastIndex] / 4.0) * graphHeight;
        
        // 効率に応じて色を変更
        const lastValue = this.data[lastIndex];
        if (lastValue >= 2.0) {
            this.ctx.fillStyle = '#2ecc71'; // 緑
        } else if (lastValue >= 1.0) {
            this.ctx.fillStyle = '#f39c12'; // オレンジ
        } else {
            this.ctx.fillStyle = '#e74c3c'; // 赤
        }
        
        this.ctx.beginPath();
        this.ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
}