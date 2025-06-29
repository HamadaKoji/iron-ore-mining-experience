import { Game } from './game.js';

// ゲーム開始
window.addEventListener('load', () => {
    window.game = new Game('gameCanvas');
});
