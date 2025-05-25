import {
    BOARD_WIDTH,
    BOARD_HEIGHT,
    GAME_BOARD_CELL_CLASS
} from './constants.js';

import {
    currentMino,
    gameStarted,
    boardCells
} from './game.js';

// 固定されたブロックを保存する配列（行×列の2次元配列）
let fixedBlocks = [];

/**
 * 固定ブロック配列を初期化
 */
export function initializeFixedBlocks() {
    fixedBlocks = [];
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        fixedBlocks[r] = [];
        for (let c = 0; c < BOARD_WIDTH; c++) {
            fixedBlocks[r][c] = null; // null = 空、文字列 = 色クラス名
        }
    }
}

/**
 * ミノが指定位置に配置可能かチェック
 * @param {Object} mino - チェックするミノ
 * @param {number} newX - 新しいX座標
 * @param {number} newY - 新しいY座標
 * @returns {boolean} - 配置可能ならtrue
 * 
 * TODO: checkCollisionで統一する
 */
function canPlaceMino(mino, newX, newY) {
    if (!mino || !mino.shape) return false;

    for (let r = 0; r < mino.shape.length; r++) {
        for (let c = 0; c < mino.shape[r].length; c++) {
            if (mino.shape[r][c] === 1) {
                const boardX = newX + c;
                const boardY = newY + r;

                // 範囲外チェック
                if (boardX < 0 || boardX >= BOARD_WIDTH ||
                    boardY < 0 || boardY >= BOARD_HEIGHT) {
                    return false;
                }

                // 固定ブロックとの衝突チェック
                if (fixedBlocks[boardY] && fixedBlocks[boardY][boardX] !== null) {
                    return false;
                }
            }
        }
    }
    return true;
}

/**
 * ミノを時計回りに90度回転
 * @param {Array} shape - 回転前の形状配列
 * @returns {Array} - 回転後の形状配列
 */
function rotateShape(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = [];

    for (let c = 0; c < cols; c++) {
        rotated[c] = [];
        for (let r = rows - 1; r >= 0; r--) {
            rotated[c][rows - 1 - r] = shape[r][c];
        }
    }
    return rotated;
}

/**
 * ゲームボード全体を再描画（固定ブロック + 現在のミノ）
 */
function redrawGameBoard() {
    if (!boardCells.length) return;

    // 全セルをクリア
    boardCells.forEach(row =>
        row.forEach(cell => cell.className = GAME_BOARD_CELL_CLASS)
    );

    // 固定ブロックを描画
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
            if (fixedBlocks[r][c] !== null) {
                boardCells[r][c].className = `${GAME_BOARD_CELL_CLASS} ${fixedBlocks[r][c]}`;
            }
        }
    }

    // 現在のミノを描画
    if (currentMino) {
        currentMino.shape.forEach((row, r_offset) => {
            row.forEach((cellValue, c_offset) => {
                if (cellValue === 1) {
                    const targetRow = currentMino.y + r_offset;
                    const targetCol = currentMino.x + c_offset;
                    if (boardCells[targetRow] && boardCells[targetRow][targetCol]) {
                        boardCells[targetRow][targetCol].className =
                            `${GAME_BOARD_CELL_CLASS} ${currentMino.color}`;
                    }
                }
            });
        });
    }
}

/**
 * ブロックを左に移動
 */
function moveLeft() {
    if (!currentMino || !gameStarted) return;

    const newX = currentMino.x - 1;
    if (canPlaceMino(currentMino, newX, currentMino.y)) {
        currentMino.x = newX;
        redrawGameBoard();
    }
}

/**
 * ブロックを右に移動
 */
function moveRight() {
    if (!currentMino || !gameStarted) return;

    const newX = currentMino.x + 1;
    if (canPlaceMino(currentMino, newX, currentMino.y)) {
        currentMino.x = newX;
        redrawGameBoard();
    }
}

/**
 * ブロックを回転
 */
function rotateMino() {
    if (!currentMino || !gameStarted) return;

    const rotatedShape = rotateShape(currentMino.shape);
    const originalShape = currentMino.shape;

    // 一時的に回転後の形状を設定してチェック
    currentMino.shape = rotatedShape;

    if (canPlaceMino(currentMino, currentMino.x, currentMino.y)) {
        // 回転可能な場合はそのまま
        redrawGameBoard();
    } else {
        // 回転不可能な場合は元に戻す
        currentMino.shape = originalShape;
    }
}

/**
 * ブロックを高速落下（ソフトドロップ）
 */
function softDrop() {
    if (!currentMino || !gameStarted) return;

    const newY = currentMino.y + 1;
    if (canPlaceMino(currentMino, currentMino.x, newY)) {
        currentMino.y = newY;
        redrawGameBoard();
    }
}

/**
 * ブロックを一番下まで瞬間落下（ハードドロップ）
 */
function hardDrop() {
    if (!currentMino || !gameStarted) return;

    // 一番下まで移動可能な位置を探す
    let dropY = currentMino.y;
    while (canPlaceMino(currentMino, currentMino.x, dropY + 1)) {
        dropY++;
    }

    // 位置を更新
    currentMino.y = dropY;
    redrawGameBoard();
}

/**
 * キーボードイベントリスナー
 */
function handleKeyPress(event) {
    if (!gameStarted) return;

    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            event.preventDefault();
            moveRight();
            break;
        case 'ArrowUp':
            event.preventDefault();
            rotateMino();
            break;
        case 'ArrowDown':
            event.preventDefault();
            softDrop();
            break;
        case ' ': // スペースキー
        case 'Space':
            event.preventDefault();
            hardDrop();
            break;
    }
}

/**
 * ブロック操作機能の初期化
 * この関数をmain.jsから呼び出して初期化する
 */
export function initializeBlockControls() {
    // 固定ブロック配列を初期化
    initializeFixedBlocks();

    // キーボードイベントリスナーを設定
    document.addEventListener('keydown', handleKeyPress);
}

/**
 * 現在のミノを固定ブロックとして配置
 * この関数は他のモジュールから呼び出される想定
 */
export function fixCurrentMino() {
    if (!currentMino) return;

    currentMino.shape.forEach((row, r_offset) => {
        row.forEach((cellValue, c_offset) => {
            if (cellValue === 1) {
                const targetRow = currentMino.y + r_offset;
                const targetCol = currentMino.x + c_offset;
                if (targetRow >= 0 && targetRow < BOARD_HEIGHT &&
                    targetCol >= 0 && targetCol < BOARD_WIDTH) {
                    fixedBlocks[targetRow][targetCol] = currentMino.color;
                }
            }
        });
    });
}

/**
 * 衝突判定のユーティリティ関数（他のモジュールから利用可能）
 */
export function checkCollision(mino, newX, newY) {
    return !canPlaceMino(mino, newX, newY);
}

/**
 * 固定ブロック配列を取得（他のモジュールから参照可能）
 */
export function getFixedBlocks() {
    return fixedBlocks;
}

/**
 * ゲームボード再描画関数をエクスポート（game.jsから利用）
 */
export { redrawGameBoard };