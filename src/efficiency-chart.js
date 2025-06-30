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
            padding: 25,
            paddingLeft: 35,
            paddingTop: 20,
            paddingBottom: 25,
            gridLines: 4,
            color: '#f39c12',
            minYScale: 20.0,  // 最小Y軸スケール（生産密度システム用）
            yScaleMultiplier: 1.2  // データ最大値に対する余裕係数
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
        
        // 現在のデータの最大値を計算
        const maxValue = Math.max(...this.data, 0);
        
        // Y軸のスケールを決定（最小値は4.0、データに応じて自動調整）
        this.currentYScale = Math.max(
            this.config.minYScale,
            Math.ceil(maxValue * this.config.yScaleMultiplier)
        );
        
        // グリッドとラベルを描画
        this.drawGrid();
        
        // データラインを描画
        this.drawLine();
    }
    
    /**
     * グリッドとラベルを描画
     */
    drawGrid() {
        const { paddingLeft, paddingTop, paddingBottom } = this.config;
        const paddingRight = 20;
        const graphWidth = this.width - paddingLeft - paddingRight;
        const graphHeight = this.height - paddingTop - paddingBottom;
        
        // グリッドラインのスタイル
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 水平グリッドライン
        for (let i = 0; i <= this.config.gridLines; i++) {
            const y = paddingTop + (graphHeight / this.config.gridLines) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(paddingLeft, y);
            this.ctx.lineTo(this.width - paddingRight, y);
            this.ctx.stroke();
            
            // Y軸ラベル（効率値）
            const value = (this.config.gridLines - i) * (this.currentYScale / this.config.gridLines);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'right';
            // 整数の場合は小数点を表示しない
            const labelText = value % 1 === 0 ? value.toString() : value.toFixed(1);
            this.ctx.fillText(labelText, paddingLeft - 5, y + 3);
        }
        
        // 時間軸のマーカー（5点ごと = 75秒ごと）
        for (let i = 0; i < this.maxDataPoints; i += 5) {
            const x = paddingLeft + (graphWidth / (this.maxDataPoints - 1)) * i;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.height - paddingBottom);
            this.ctx.lineTo(x, this.height - paddingBottom + 5);
            this.ctx.stroke();
            
            // X軸ラベル（時間）
            const minutes = (this.maxDataPoints - i) * 15 / 60;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '9px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${minutes}分前`, x, this.height - 5);
        }
    }
    
    /**
     * データラインを描画
     */
    drawLine() {
        const { paddingLeft, paddingTop, paddingBottom, color } = this.config;
        const paddingRight = 20;
        const graphWidth = this.width - paddingLeft - paddingRight;
        const graphHeight = this.height - paddingTop - paddingBottom;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        this.data.forEach((value, index) => {
            const x = paddingLeft + (graphWidth / (this.maxDataPoints - 1)) * index;
            const y = paddingTop + graphHeight - (value / this.currentYScale) * graphHeight; // 動的なスケールで正規化
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // 最新の値に点を描画
        const lastIndex = this.data.length - 1;
        const lastX = paddingLeft + (graphWidth / (this.maxDataPoints - 1)) * lastIndex;
        const lastY = paddingTop + graphHeight - (this.data[lastIndex] / this.currentYScale) * graphHeight;
        
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