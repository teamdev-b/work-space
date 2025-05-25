import {
	initializeBoardAndNextArea,
	handleStartButtonClick,
	handleReStartButtonClick,
	initGameDOMElements
} from './game.js';

import { initializeBlockControls } from './block.js';

/*
================================================================================
  DOM要素の取得
================================================================================
*/
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score-display');
const startPauseButton = document.getElementById('start-pause-button');
const nextMinoArea = document.getElementById('next-mino-area');
const gameOverMessage = document.getElementById('game-over-message');
const restartButton = document.getElementById('restart-button');

// DOM参照をgame.jsへ渡す
initGameDOMElements({
    board: gameBoard,
    score: scoreDisplay,
    button: startPauseButton,
    nextArea: nextMinoArea,
    gameOver: gameOverMessage
});

/*
================================================================================
  イベントリスナーの設定
================================================================================
*/
// ゲームスタート
startPauseButton.addEventListener('click', handleStartButtonClick);

// ゲームオーバー時のリトライ
restartButton.addEventListener('click', handleReStartButtonClick);

/*
================================================================================
  初期設定の呼び出し
================================================================================
*/
initializeBoardAndNextArea();
initializeBlockControls();