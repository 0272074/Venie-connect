import { Board } from './board.js';
import { Solver } from './solver.js';
import { Tile } from './tile.js';
import { CONSTANTS } from './constants.js';

function runTest(name, body) {
    try {
        console.log(`Running: ${name}`);
        body();
        console.log(`[PASS] ${name}`);
    } catch (e) {
        console.error(`[FAIL] ${name}:`, e);
    }
}

runTest('Basic Loop Check', () => {
    const board = new Board();
    // Create a 2x2 loop
    // Top-Left: Curve (Bottom-Right) -> Rot 0 (Base: Bottom,Right)
    const tl = new Tile(CONSTANTS.TILE_CURVE);
    tl.setRotation(0);
    board.placeTile(0, 0, tl);

    // Top-Right: Curve (Bottom-Left) -> Rot 1 (Left, Bottom)
    const tr = new Tile(CONSTANTS.TILE_CURVE);
    tr.setRotation(1);
    board.placeTile(1, 0, tr);

    // Bottom-Right: Curve (Top-Left) -> Rot 2 (Top, Left)
    const br = new Tile(CONSTANTS.TILE_CURVE);
    br.setRotation(2);
    board.placeTile(1, 1, br);

    // Bottom-Left is EMPTY.
    // Needs Curve (Top-Right) -> Rot 3 (Right, Top) to close.

    // Check if possible with 1 curve
    const possible = Solver.isPossible(board, 0, 1);

    if (!possible) throw new Error('Should be possible to close the loop with 1 curve');
});

runTest('Impossible Scene', () => {
    const board = new Board();
    // Place two straights pointing away
    // 0,0: Straight Up-Down
    const t1 = new Tile(CONSTANTS.TILE_STRAIGHT);
    t1.setRotation(0);
    board.placeTile(0, 0, t1);

    // 0,2: Straight Up-Down (Gap at 0,1)
    const t2 = new Tile(CONSTANTS.TILE_STRAIGHT);
    t2.setRotation(0);
    board.placeTile(0, 2, t2);

    // We need a straight at 0,1 to connect them.
    // Give 0 straights, 10 curves.
    const possible = Solver.isPossible(board, 0, 10);

    // Should be false because we cannot bridge the gap with curves.
    if (possible) throw new Error('Should be impossible without straights');
});

console.log('All tests finished.');
