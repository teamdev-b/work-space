// プレイフィールドとNext用の定数
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const NEXT_AREA_SIZE = 4;

// ミノの定義（1:ブロックあり 0:ブロックなし）
export const TETROMINOES = {
    'I': { shape: [[1, 1, 1, 1]], color: 'mino-cyan' },
    'O': { shape: [[1, 1], [1, 1]], color: 'mino-yellow' },
    'T': { shape: [[0, 1, 0], [1, 1, 1]], color: 'mino-purple' },
    'S': { shape: [[0, 1, 1], [1, 1, 0]], color: 'mino-green' },
    'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: 'mino-red' },
    'J': { shape: [[1, 0, 0], [1, 1, 1]], color: 'mino-blue' },
    'L': { shape: [[0, 0, 1], [1, 1, 1]], color: 'mino-orange' }
};

export const MINO_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// 自動落下用の定数
export const DROP_INTERVAL = 1000; // 1000ミリ秒 = 1秒ごとに落下

// CSSクラス名を定数化
export const GAME_BOARD_CELL_CLASS = 'game-board-cell';
export const NEXT_AREA_CELL_CLASS = 'next-area-cell';