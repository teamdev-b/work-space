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

// 外部で定義される変数を格納用としてexport
export let boardCells = [];
export let nextMinoCells = [];
export let currentMino = null;
export let nextMino = null;
export let gameStarted = false;

// ゲームループ関連の変数
let lastDropTime = 0;
let gameLoopId = null;

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
 * 自動落下に際し、ゲームボード全体をクリアし現在のミノを描画する
 */
function redrawGameBoard() {
    // TODO: 固定されたブロックの描画を考慮する

    // boardCellsが未初期化なら何もしない
    if (!boardCells.length) return;

    // ボード全体をクリア
    boardCells.forEach(row => row.forEach(cell => cell.className = GAME_BOARD_CELL_CLASS));

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
* メインフィールドとNextにミノを配置する
*/
export function spawnNewMino() {
    currentMino = nextMino;
    nextMino = getRandomMino();

    if (currentMino) {
        currentMino.y = 0;
        const shapeWidth = currentMino.shape[0] ? currentMino.shape[0].length : 0;
        currentMino.x = Math.floor((BOARD_WIDTH - shapeWidth) / 2);

        // 重複描画を避けるため、spawnNewMino時の描画はredrawGameBoardに任せる
        // boardCells.forEach(row => row.forEach(cell => cell.className = GAME_BOARD_CELL_CLASS));
        // drawMinoOnGrid(currentMino, boardCells, GAME_BOARD_CELL_CLASS);
    }
    displayNextMino();
}

/**
 * 現在のミノを1マス下に単純に移動させる処理。
 */
function simpleMoveMinoDown() {
    if (!currentMino || !gameStarted) return;
    currentMino.y++; // Y座標を1増やす
    redrawGameBoard(); // 画面を再描画
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
        simpleMoveMinoDown();
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
* ボタンクリック時の開始関数
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

        // ゲームループを開始
        startGameLoop();
    }
}