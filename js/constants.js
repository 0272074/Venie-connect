export const CONSTANTS = {
    TILE_SIZE: 60,                // Size of one tile in pixels
    BOARD_SIZE: 16,               // Logical board size (e.g. 16x16 grid space, though dynamic)
    VISIBLE_ROWS: 10,             // How many rows visible in canvas
    VISIBLE_COLS: 10,

    // Tile Types
    TILE_STRAIGHT: 'STRAIGHT',
    TILE_CURVE: 'CURVE',

    // Directions (0: Up, 1: Right, 2: Down, 3: Left)
    DIR_UP: 0,
    DIR_RIGHT: 1,
    DIR_DOWN: 2,
    DIR_LEFT: 3,

    // Colors for Canvas Drawing
    COLOR_BG: '#222222',
    COLOR_GRID: '#333333',
    COLOR_TILE_BASE: '#b0bec5',   // Light grey stone
    COLOR_TILE_BORDER: '#78909c',
    COLOR_WATER: '#039be5',       // Blue water
    COLOR_HOVER_VALID: 'rgba(102, 187, 106, 0.5)',
    COLOR_HOVER_INVALID: 'rgba(239, 83, 80, 0.5)',
};
