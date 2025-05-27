import { 
    BOARD_WIDTH, 
    BOARD_HEIGHT, 
    NEXT_AREA_SIZE, 
    TETROMINOES, 
    MINO_TYPES,
    DROP_INTERVAL,
    GAME_BOARD_CELL_CLASS,
    NEXT_AREA_CELL_CLASS
} from './constants.js';

import { checkCollision } from './collision.js';

// 外部で定義される変数を格納用としてexport
export let boardCells = [];
export let nextMinoCells = [];
export let currentMino = null;
export let nextMino = null;
export let gameStarted = false;

// ゲームループ関連の変数
let lastDropTime = 0;
let gameLoopId = null;

// 固定されたブロックの状態を保持する配列
let gameBoardState = [];

// block.jsから盤面状態を参照するためのゲッター関数
export function getGameBoardState() {
    return gameBoardState;
}

/*
* 取得したDOM要素を初期化する（main.js側で渡す想定）
*/
let gameBoard, scoreDisplay, startPauseButton, nextMinoArea, gameOverMessage;
export function initGameDOMElements({ board, score, button, nextArea, gameOver }) {
    gameBoard = board;
    scoreDisplay = score;
    startPauseButton = button;
    nextMinoArea = nextArea;
    gameOverMessage = gameOver;
}

/*
* 取得したDOM要素を初期化する
*/
export function createGridCells(rows, cols, containerElement, cellBaseClass) {
    containerElement.innerHTML = '';
    const cells = [];
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
* プレイフィールドとNextを初期化する
*/
export function initializeBoardAndNextArea() {
    boardCells = createGridCells(BOARD_HEIGHT, BOARD_WIDTH, gameBoard, GAME_BOARD_CELL_CLASS);
    nextMinoCells = createGridCells(NEXT_AREA_SIZE, NEXT_AREA_SIZE, nextMinoArea, NEXT_AREA_CELL_CLASS);

    // 固定されたブロックの状態を初期化 (全て0にする)
    gameBoardState = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

    scoreDisplay.textContent = '0';
    startPauseButton.textContent = 'Start';
    gameStarted = false;
    gameOverMessage.classList.add('hidden');

    // もし既存のゲームループが動いていたら停止
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    // ゲーム状態もリセット
    currentMino = null;
    nextMino = null;

    // 初期化時にプレイフィールドとNextをクリア表示
    redrawGameBoard(); 
    displayNextMino(); 
}

/*
* ランダムにミノを生成する
*/
export function getRandomMino() {
    const type = MINO_TYPES[Math.floor(Math.random() * MINO_TYPES.length)];
    const minoData = TETROMINOES[type];
    return {
        shape: minoData.shape.map(row => [...row]), // ミノの内容を新たな配列として展開する
        color: minoData.color,
        x: 0,
        y: 0
    };
}

/*
* クラスを付与しミノの各ブロック部分を描写する
*/
export function drawMinoOnGrid(mino, gridCellArray, baseCellClass) {
    if (!mino || !mino.shape) return;
    mino.shape.forEach((row, r_offset) => {
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

/**
 * ライン消去処理
 */
function clearFullLines() {
    const newBoard = gameBoardState.filter(row => row.some(cell => cell === 0));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    for (let i = 0; i < linesCleared; i++) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    gameBoardState = newBoard;
    return linesCleared;
}

/**
 * ミノを固定した後、新しいミノをスポーンし、盤面を再描画
 */
export function lockMino() {
    if (!currentMino) return;

    currentMino.shape.forEach((row, rOffset) => {
        row.forEach((cellValue, cOffset) => {
            if (cellValue === 1) {
                const boardX = currentMino.x + cOffset;
                const boardY = currentMino.y + rOffset;
                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    gameBoardState[boardY][boardX] = currentMino.color;
                }
            }
        });
    });
 
    // ライン消去処理を呼び出し
    const cleared = clearFullLines();
    if (cleared > 0) {
        const currentScore = parseInt(scoreDisplay.textContent, 10) || 0;

        // ライン数に応じたスコアテーブル
        const scoreTable = {
            1: 100,
            2: 300,
            3: 500,
            4: 800
        };

        const addedScore = scoreTable[cleared] || 0;
        scoreDisplay.textContent = currentScore + addedScore;
    }

    // 新しいミノを出現させる処理
    spawnNewMino(); 
    
    // 固定された盤面と新しいミノ（ゲームオーバーでなければ）を描画
    redrawGameBoard(); 

    // TODO: ライン消去処理
}


/**
 * 自動落下に際し、ゲームボード全体をクリアし現在のミノを描画する
 */
export function redrawGameBoard() {
    // boardCellsが未初期化なら何もしない
    if (!boardCells.length) return;

    // ボード全体をクリア
    boardCells.forEach(row => row.forEach(cell => cell.className = GAME_BOARD_CELL_CLASS));

    // 固定するブロックの位置を設定する
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
            if (gameBoardState[r][c] !== 0) {
                if (boardCells[r] && boardCells[r][c]) {
                    boardCells[r][c].className = `${GAME_BOARD_CELL_CLASS} ${gameBoardState[r][c]}`;
                }
            }
        }
    }

    // 現在のミノを描画
    if (currentMino) {
        drawMinoOnGrid(currentMino, boardCells, GAME_BOARD_CELL_CLASS);
    }
}

/*
* Nextにミノを配置する
*/
export function displayNextMino() {
    // いったん内容をリセットする
    for (let r = 0; r < NEXT_AREA_SIZE; r++) {
        for (let c = 0; c < NEXT_AREA_SIZE; c++) {
            if (nextMinoCells[r] && nextMinoCells[r][c]) {
                nextMinoCells[r][c].className = NEXT_AREA_CELL_CLASS;
            }
        }
    }

    if (!nextMino || !nextMino.shape) return;
    const shapeHeight = nextMino.shape.length;
    const shapeWidth = nextMino.shape[0] ? nextMino.shape[0].length : 0;

    // エリア中央に設定する
    const minoToDisplay = {
        shape: nextMino.shape,
        color: nextMino.color,
        y: Math.floor((NEXT_AREA_SIZE - shapeHeight) / 2),
        x: Math.floor((NEXT_AREA_SIZE - shapeWidth) / 2)
    };

    minoToDisplay.x = Math.max(0, minoToDisplay.x);
    minoToDisplay.y = Math.max(0, minoToDisplay.y);

    drawMinoOnGrid(minoToDisplay, nextMinoCells, NEXT_AREA_CELL_CLASS);
}

/*
* 新しいミノをスポーンし、ゲームオーバー判定を行う
*/
export function spawnNewMino() {
    currentMino = nextMino;
    nextMino = getRandomMino();

    if (currentMino) {
        currentMino.y = 0;
        const shapeWidth = currentMino.shape[0] ? currentMino.shape[0].length : 0;
        currentMino.x = Math.floor((BOARD_WIDTH - shapeWidth) / 2);

        // ゲームオーバー判定 (新しいミノが出現位置で即衝突する場合)
        if (checkCollision(currentMino, gameBoardState)) {
            gameStarted = false; // ゲーム終了状態
            if (gameOverMessage) { // DOM要素が初期化されていれば
                gameOverMessage.classList.remove('hidden');
                // TODO: finalScoreDisplay にスコアを表示するなどの処理
            }
            currentMino = null; // 操作ミノをなくす
        }
    }
    displayNextMino();
}

/**
 * 現在のミノを1マス下に動かす。衝突すれば固定する。
 */
function moveMinoDown() {
    if (!currentMino || !gameStarted) return;
    const testMino = { ...currentMino, y: currentMino.y + 1 };

    if (checkCollision(testMino, gameBoardState)) { // インポートしたcheckCollisionを使用
        lockMino();
    } else {
        currentMino.y++;
        redrawGameBoard(); // 自動落下時はここで再描画
    }
    redrawGameBoard(); // 移動後または固定後の盤面を再描画
}

/**
 * ゲームループ処理（コールバック関数）
 * ※timestamp→現在時刻
 */
function gameLoop(timestamp) {
    if (!gameStarted) { // ゲームが開始されていない、または停止された場合
        if(gameLoopId) cancelAnimationFrame(gameLoopId); //念のためループIDがあればクリア
        gameLoopId = null;
        return;
    }

    // 前回のブロック落下処理からの経過時間を取得する
    const elapsedTime = timestamp - lastDropTime;

    // 経過時間(Time)が、設定した落下間隔(DROP_INTERVAL)を超えたかどうかを確認する
    if (elapsedTime > DROP_INTERVAL) {
        // ブロックを1マス下に落とす処理を実行
        moveMinoDown();
        // 最終落下時刻を現在の時刻に更新し、次回の落下タイミングの基準にする
        lastDropTime = timestamp;
    }

    // 再度requestAnimationFrameを呼び出して次の描画タイミングでもう一度この関数自身を実行する
    gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * ゲームループを開始する関数
 */
function startGameLoop() {
    if(gameLoopId) return; // すでにループが開始されていれば何もしない

    // 現在時刻を取得する
    lastDropTime = performance.now();

    // gameStartedフラグはhandleStartButtonClickでtrueに設定されるが明示的に確認
    if (gameStarted) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

/*
* スタートボタンクリック時の開始関数
*/
export function handleStartButtonClick() {
    if (!gameStarted) { // 既に開始していたら何もしない
        // ボードを初期化する（クリア）
        initializeBoardAndNextArea();

        gameStarted = true;
        // startPauseButton.textContent = 'Pause'; // UIの変更はmain.jsが担当しても良い

        nextMino = getRandomMino(); // 最初のNextミノ
        spawnNewMino();          // currentMino と次の nextMino を準備
        redrawGameBoard();       // 初期配置の currentMino を描画

        // ゲームオーバーでなければループ開始
        if (gameStarted) {
            startGameLoop();
        }
    }

    // TODO: ゲーム中に再度押された場合のポーズ/再開処理
}

/*
* ゲームオーバー時のリスタート関数
*/
export function handleReStartButtonClick() {
    // ゲームオーバー画面を閉じる
    if(gameOverMessage) {
        gameOverMessage.classList.add('hidden');
    }

    // ゲームの状態を初期化する
    initializeBoardAndNextArea(); 
}