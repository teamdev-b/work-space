import { 
    BOARD_WIDTH, 
    BOARD_HEIGHT, 
    NEXT_AREA_SIZE, 
    TETROMINOES, 
    MINO_TYPES 
} from './constants.js';

// 外部で定義される変数を格納用としてexport
export let boardCells = [];
export let nextMinoCells = [];
export let currentMino = null;
export let nextMino = null;
export let gameStarted = false;

// DOM要素は main.js 側で渡す想定にする
let gameBoard, scoreDisplay, startPauseButton, nextMinoArea, gameOverMessage;

/*
* 取得したDOM要素を初期化する
*/
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
    boardCells = createGridCells(BOARD_HEIGHT, BOARD_WIDTH, gameBoard, 'game-board-cell');
    nextMinoCells = createGridCells(NEXT_AREA_SIZE, NEXT_AREA_SIZE, nextMinoArea, 'next-area-cell');
    scoreDisplay.textContent = '0';
    startPauseButton.textContent = 'Start';
    gameStarted = false;
    gameOverMessage.classList.add('hidden');
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

/*
* Nextにミノを配置する
*/
export function displayNextMino() {
    // いったん内容をリセットする
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

    // エリア中央に設定する
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
* メインフィールドとNextにミノを配置する
*/
export function spawnNewMino() {
    currentMino = nextMino;
    nextMino = getRandomMino();

    if (currentMino) {
        currentMino.y = 0;
        const shapeWidth = currentMino.shape[0] ? currentMino.shape[0].length : 0;
        currentMino.x = Math.floor((BOARD_WIDTH - shapeWidth) / 2);
        boardCells.forEach(row => row.forEach(cell => cell.className = 'game-board-cell'));
        drawMinoOnGrid(currentMino, boardCells, 'game-board-cell');
    }

    displayNextMino();
}

/*
* ボタンクリック時の開始関数
*/
export function handleStartButtonClick() {
    if (!gameStarted) {
        gameStarted = true;
        nextMino = getRandomMino();
        spawnNewMino();
    }
}