import {
    currentMino,
    gameStarted,
    getGameBoardState, 
    redrawGameBoard as redrawGameboardFromGame, 
    lockMino 
} from './game.js';

import { checkCollision } from './collision.js';

/**
 * ミノが指定位置に配置可能かチェック (checkCollision を使用するように変更)
 * @param {Object} minoToCheck - チェックするミノ (形状、現在のx, yを含む)
 * @param {number} newX - 新しいX座標
 * @param {number} newY - 新しいY座標
 * @returns {boolean} - 配置可能ならtrue
 */
function canPlaceMino(minoToCheck, newX, newY) {
    if (!minoToCheck || !minoToCheck.shape) return true; // ミノがない場合は配置可能とする（エラー回避）
    
    const tempMino = { // 判定用の仮ミノオブジェクト
        ...minoToCheck,
        x: newX,
        y: newY
    };
    return !checkCollision(tempMino, getGameBoardState());
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
 * ブロックを左に移動
 */
function moveLeft() {
    if (!currentMino || !gameStarted) return;
    if (canPlaceMino(currentMino, currentMino.x - 1, currentMino.y)) {
        currentMino.x--;
        redrawGameboardFromGame(); // game.jsの描画関数を呼び出す
    }
}

/**
 * ブロックを右に移動
 */
function moveRight() {
    if (!currentMino || !gameStarted) return;
    if (canPlaceMino(currentMino, currentMino.x + 1, currentMino.y)) {
        currentMino.x++;
        redrawGameboardFromGame(); // game.jsの描画関数を呼び出す
    }
}

/**
 * ブロックを回転
 */
function rotateMino() {
    if (!currentMino || !gameStarted) return;
    const originalShape = currentMino.shape;
    const rotatedShape = rotateShape(originalShape);
    const tempMinoForRotation = { ...currentMino, shape: rotatedShape };

    if (canPlaceMino(tempMinoForRotation, currentMino.x, currentMino.y)) {
        currentMino.shape = rotatedShape;
        redrawGameboardFromGame(); // game.jsの描画関数を呼び出す
    }
}

/**
 * ブロックを高速落下（ソフトドロップ）
 */
function softDrop() {
    if (!currentMino || !gameStarted) return;
    if (canPlaceMino(currentMino, currentMino.x, currentMino.y + 1)) {
        currentMino.y++;
        redrawGameboardFromGame(); // game.jsの描画関数を呼び出す
        // TODO: ソフトドロップで得点がある場合はここで処理
    } else {
        // 下に動かせない場合は固定処理をgame.jsのlockMinoに任せる
        lockMino(); // 固定処理を呼び出す
    }
}

/**
 * ブロックを一番下まで瞬間落下（ハードドロップ）
 */
function hardDrop() {
    if (!currentMino || !gameStarted) return;
    let y = currentMino.y;
    while (canPlaceMino(currentMino, currentMino.x, y + 1)) {
        y++;
    }
    currentMino.y = y;
    lockMino(); // game.jsの固定処理と再描画を呼び出す
}

/**
 * キーボードイベントリスナー
 */
function handleKeyPress(event) {
    // currentMino が null の場合も操作不可
    if (!gameStarted || !currentMino) return;

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
    // キーボードイベントリスナーを設定
    document.addEventListener('keydown', handleKeyPress);
}