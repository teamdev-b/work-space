import {
	initializeBoardAndNextArea,
	handleStartButtonClick,
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
startPauseButton.addEventListener('click', handleStartButtonClick);

/*
================================================================================
  初期設定の呼び出し
================================================================================
*/
initializeBoardAndNextArea();
initializeBlockControls();