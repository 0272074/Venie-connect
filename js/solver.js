import { CONSTANTS } from './constants.js';
import { Tile } from './tile.js';

export class Solver {
    /**
     * Checks if it's possible to form a loop with the remaining tiles.
     * @param {Board} board - current board state
     * @param {number} straights - count of straights remaining
     * @param {number} curves - count of curves remaining
     * @returns {boolean} true if possible, false if impossible
     */
    static isPossible(board, straights, curves) {
        // Clone board to avoid mutating the game state
        const workingBoard = board.clone();
        return this.solve(workingBoard, straights, curves);
    }

    static solve(board, straights, curves) {
        // Base case: check if loop is already formed (no open ends)
        if (!board.hasOpenEnds()) {
            return true; // Found a solution!
        }

        if (straights === 0 && curves === 0) {
            return false; // No more tiles, still open ends
        }

        // Heuristic: Identify ALL empty spots that are adjacent to an open connection.
        // We MUST fill these open connections eventually.
        const openSpots = this.getOpenSpots(board);

        if (openSpots.length === 0) {
            // No places to connect to? But hasOpenEnds is true?
            // This means there are open ends pointing to... nowhere?
            // Wait, getOpenSpots finds empty cells pointed to by tiles.
            // valid board state: open ends ALWAYS point to an empty cell (because if they pointed to a tile, they would be connected or invalid).
            // So if hasOpenEnds is true, openSpots must be > 0.
            return false;
        }

        // Pick the first spot to try extending from.
        // Optim: Pick a spot with most neighbors? Or just first.
        const { x, y } = openSpots[0];

        const offsets = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }
        ];

        // Try placing Straight
        if (straights > 0) {
            const tile = new Tile(CONSTANTS.TILE_STRAIGHT);
            // Symmetry check: only need to try rot 0 and 1 for straights
            for (let r = 0; r < 2; r++) {
                tile.setRotation(r);
                if (board.isValidPlacement(x, y, tile)) {
                    board.placeTile(x, y, tile);
                    if (this.solve(board, straights - 1, curves)) return true;
                    board.removeTile(x, y); // Backtrack
                }
            }
        }

        // Try placing Curve
        if (curves > 0) {
            const tile = new Tile(CONSTANTS.TILE_CURVE);
            for (let r = 0; r < 4; r++) {
                tile.setRotation(r);
                if (board.isValidPlacement(x, y, tile)) {
                    board.placeTile(x, y, tile);
                    if (this.solve(board, straights, curves - 1)) return true;
                    board.removeTile(x, y); // Backtrack
                }
            }
        }

        return false;
    }

    static getOpenSpots(board) {
        // Find grid cells (x, y) that are empty but have a neighbor pointing to them.
        const spots = new Set();
        const offsets = [
            { dx: 0, dy: -1 }, // 0: Up
            { dx: 1, dy: 0 },  // 1: Right
            { dx: 0, dy: 1 },  // 2: Down
            { dx: -1, dy: 0 }  // 3: Left
        ];

        for (const [key, tile] of board.grid) {
            const [x, y] = key.split(',').map(Number);
            const conns = tile.getConnections();

            for (const dir of conns) {
                const nx = x + offsets[dir].dx;
                const ny = y + offsets[dir].dy;
                // If the neighbor spot is empty, it's an open spot we can extend into
                if (!board.getTile(nx, ny)) {
                    spots.add(`${nx},${ny}`);
                }
            }
        }

        return Array.from(spots).map(s => {
            const [x, y] = s.split(',').map(Number);
            return { x, y };
        });
    }
}
