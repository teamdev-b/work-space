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
// const finalScoreDisplay = document.getElementById('final-score'); // 今回は使いません
// const restartButton = document.getElementById('restart-button'); // 今回は使いません


/*
================================================================================
  定数
================================================================================
*/
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const NEXT_AREA_SIZE = 4;


/*
================================================================================
  初期化関数
================================================================================
*/

/*
* 土台のセルを生成する
*/
function createGridCells(rows, cols, containerElement, cellBaseClass) {
    containerElement.innerHTML = '';
    const cells = [];

    // 行列数に応じてセルとなるdiv要素を生成する
    for (let r = 0; r < rows; r++) {
        const rowArray = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.classList.add(cellBaseClass);
            containerElement.appendChild(cell);
            rowArray.push(cell);
        }
        cells.push(rowArray);
    }
    return cells;
}


/*
* 各初期化処理
*/
function initializeBoardAndNextArea() {
    // プレイフィールドの土台のセルを生成する
    boardCells = createGridCells(BOARD_HEIGHT, BOARD_WIDTH, gameBoard, 'game-board-cell');

    // Nextの土台のセルを生成する
    nextMinoCells = createGridCells(NEXT_AREA_SIZE, NEXT_AREA_SIZE, nextMinoArea, 'next-area-cell');

    // スコア表示を初期化
    scoreDisplay.textContent = '0';

    // ボタンテキストを初期状態に
    startPauseButton.textContent = 'Start';

    // ゲーム開始フラグをリセット
    gameStarted = false;
    
    // ゲームオーバー画面は表示しない
    gameOverMessage.classList.add('hidden');
}


/*
================================================================================
  ブロックの定数データ
================================================================================
*/

// 各ブロックの形状データ（1: ブロックあり、2: ブロックなし）と色データ
const TETROMINOES = {
    'I': { shape: [[1, 1, 1, 1]], color: 'mino-cyan' },
    'O': { shape: [[1, 1], [1, 1]], color: 'mino-yellow' },
    'T': { shape: [[0, 1, 0], [1, 1, 1]], color: 'mino-purple' },
    'S': { shape: [[0, 1, 1], [1, 1, 0]], color: 'mino-green' },
    'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: 'mino-red' },
    'J': { shape: [[1, 0, 0], [1, 1, 1]], color: 'mino-blue' },
    'L': { shape: [[0, 0, 1], [1, 1, 1]], color: 'mino-orange' }
};

// 各ブロックの形状
const MINO_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];


/*
================================================================================
  ファイル内変数
================================================================================
*/
let boardCells = [];
let nextMinoCells = [];
let currentMino = null;
let nextMino = null;
let gameStarted = false;


/*
================================================================================
  スタート時の関数
================================================================================
*/

/*
* ランダムにブロックを生成する
*/
function getRandomMino() {
    const type = MINO_TYPES[Math.floor(Math.random() * MINO_TYPES.length)];
    const minoData = TETROMINOES[type];
    return {
        shape: minoData.shape.map(row => [...row]), // 形状データの値をコピー
        color: minoData.color,
        x: 0,
        y: 0
    };
}


/*
* プレイフィールドにブロックを配置する
*/
function drawMinoOnGrid(mino, gridCellArray, baseCellClass) {
    if (!mino || !mino.shape) return;
    // 行ループ
    mino.shape.forEach((row, r_offset) => {
        // 1行中の列ループ
        row.forEach((cellValue, c_offset) => {
            if (cellValue === 1) {
                const targetRow = mino.y + r_offset;
                const targetCol = mino.x + c_offset;
                if (gridCellArray[targetRow] && gridCellArray[targetRow][targetCol]) {
                    gridCellArray[targetRow][targetCol].className = `${baseCellClass} ${mino.color}`;
                }
            }
        });
    });
}


/*
* Nextにブロックを配置する
*/
function displayNextMino() {
    // セルを一度クリアする
    for (let r = 0; r < NEXT_AREA_SIZE; r++) {
        for (let c = 0; c < NEXT_AREA_SIZE; c++) {
            if (nextMinoCells[r] && nextMinoCells[r][c]) {
                nextMinoCells[r][c].className = 'next-area-cell';
            }
        }
    }

    if (!nextMino || !nextMino.shape) return;
    const shapeHeight = nextMino.shape.length;
    const shapeWidth = nextMino.shape[0] ? nextMino.shape[0].length : 0;

    // エリアの中央に配置する
    const minoToDisplay = {
        shape: nextMino.shape,
        color: nextMino.color,
        y: Math.floor((NEXT_AREA_SIZE - shapeHeight) / 2),
        x: Math.floor((NEXT_AREA_SIZE - shapeWidth) / 2)
    };
    
    minoToDisplay.x = Math.max(0, minoToDisplay.x);
    minoToDisplay.y = Math.max(0, minoToDisplay.y);

    drawMinoOnGrid(minoToDisplay, nextMinoCells, 'next-area-cell');
}

/*
* プレイフィールドとNextにブロックを配置する
*/
function spawnNewMino() {
    // プレイフィールドに配置するブロックを定義
    currentMino = nextMino;

    // Nextに配置するブロックを再生成
    nextMino = getRandomMino();

    if (currentMino) {
        currentMino.y = 0;
        const shapeWidth = currentMino.shape[0] ? currentMino.shape[0].length : 0;
        currentMino.x = Math.floor((BOARD_WIDTH - shapeWidth) / 2);
        
        // 前回のブロックが残らないようにプレイフィールドのセルを一度クリア
        boardCells.forEach(row => row.forEach(cell => cell.className = 'game-board-cell'));

        drawMinoOnGrid(currentMino, boardCells, 'game-board-cell');
    }

    displayNextMino();
}


/*
================================================================================
  ゲーム制御関数
================================================================================
*/

/*
* ゲームスタート
*/
function handleStartButtonClick() {
    if (!gameStarted) {
        gameStarted = true;
        // TODO: 必要ならばボタンのテキスト変更等を行う
        // startPauseButton.textContent = 'Playing'; 

        // 最初のNextミノを生成
        nextMino = getRandomMino(); 

        // currentMinoの配置と、次のnextMinoの準備・表示
        spawnNewMino(); 
    }
}

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