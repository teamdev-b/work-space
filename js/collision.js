import { 
    BOARD_WIDTH, 
    BOARD_HEIGHT 
} from './constants.js';

/**
 * 指定されたミノが、指定された位置で衝突するかどうかを判定する
 * ボードの境界（底、左右）または他の固定ブロックとの衝突をチェックする
 * @param {object} mino - 判定対象のミノオブジェクト(shape, x, y を持つ)
 * @param {Array<Array<any>>} boardState - ゲームボードの状態配列 (0は空、その他はブロックの色など)
 * @returns {boolean} 衝突する場合はtrue,しない場合はfalse
 * 
 * TODO: block.jsにある同名の関数との関連を考える（オーバーロードする？）
 */
export function checkCollision(mino, boardState) {
    if (!mino || !mino.shape) { // ミノや形状データがなければ判定不可（念のため）
        return false;
    }
    const shape = mino.shape;
    const x = mino.x;
    const y = mino.y;

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) { // ミノのブロックがある部分のみチェック
                const boardX = x + c; // グリッド上のX座標
                const boardY = y + r; // グリッド上のY座標

                // ボードの底を超えたか
                if (boardY >= BOARD_HEIGHT) {
                    return true;
                }
                // ボードの左右の壁を超えたか
                if (boardX < 0 || boardX >= BOARD_WIDTH) {
                    return true;
                }
                // ボードの上部より上は衝突としない (Y < 0 のケース)
                // ただし、その位置に固定ブロックがあることは通常ない前提。
                if (boardY < 0) {
                    continue; // このセルは盤面外なので、固定ブロックとの衝突はチェックしない
                }
                // 他の固定されたブロックに衝突したか
                // boardState[boardY] が存在し、かつその位置が空(0)でない場合
                if (boardState[boardY] && boardState[boardY][boardX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}