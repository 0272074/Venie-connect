import { CONSTANTS } from './constants.js';
import { Tile } from './tile.js';

export class Board {
    constructor() {
        // Use a Map for sparse storage: "x,y" => Tile
        this.grid = new Map();
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
    }

    getTile(x, y) {
        return this.grid.get(`${x},${y}`);
    }

    placeTile(x, y, tile) {
        this.grid.set(`${x},${y}`, tile);
        this.updateBounds(x, y);
    }

    removeTile(x, y) {
        this.grid.delete(`${x},${y}`);
        // Bounds update is expensive on remove, skipping for now or re-calculating if needed
    }

    updateBounds(x, y) {
        this.minX = Math.min(this.minX, x);
        this.maxX = Math.max(this.maxX, x);
        this.minY = Math.min(this.minY, y);
        this.maxY = Math.max(this.maxY, y);
    }

    /**
     * Checks if a placement is valid according to game rules.
     * Rules:
     * 1. Must check adjacency (must touch at least one existing tile, unless it's the very first move).
     * 2. Must match connections of neighbors.
     * 3. Cannot overlap.
     */
    isValidPlacement(x, y, tile) {
        if (this.getTile(x, y)) return false; // Overlap

        const neighbors = this.getNeighbors(x, y);

        // Rule 1: Adjacency (unless board is empty)
        if (this.grid.size > 0 && neighbors.length === 0) {
            return false;
        }

        // Rule 2: Connection matching
        // For each neighbor, check if the shared edge matches.
        // My connections (0-3) must match neighbor's opposite connection.
        // e.g. My UP (0) must match neighbor's DOWN (2).

        const myConns = tile.getConnections();

        // Directions: 0: Up, 1: Right, 2: Down, 3: Left
        // Offsets for neighbors: Up(0): y-1, Right(1): x+1, Down(2): y+1, Left(3): x-1
        const offsets = [
            { dx: 0, dy: -1 }, // 0: Up
            { dx: 1, dy: 0 },  // 1: Right
            { dx: 0, dy: 1 },  // 2: Down
            { dx: -1, dy: 0 }  // 3: Left
        ];

        for (let dir = 0; dir < 4; dir++) {
            const nx = x + offsets[dir].dx;
            const ny = y + offsets[dir].dy;
            const neighbor = this.getTile(nx, ny);

            if (neighbor) {
                const neighborConns = neighbor.getConnections();
                // Check edge compatibility
                const myHasConn = myConns.includes(dir);
                const neighborOppositeDir = (dir + 2) % 4;
                const neighborHasConn = neighborConns.includes(neighborOppositeDir);

                if (myHasConn !== neighborHasConn) {
                    return false; // Mismatch!
                }
            }
        }

        return true;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const offsets = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        for (const [dx, dy] of offsets) {
            const tile = this.getTile(x + dx, y + dy);
            if (tile) neighbors.push(tile);
        }
        return neighbors;
    }
    clone() {
        const newBoard = new Board();
        newBoard.grid = new Map(this.grid);
        newBoard.minX = this.minX;
        newBoard.maxX = this.maxX;
        newBoard.minY = this.minY;
        newBoard.maxY = this.maxY;
        return newBoard;
    }

    hasOpenEnds() {
        if (this.grid.size === 0) return true; // Empty board is not a closed loop? Or is it? A loop has tiles.

        const offsets = [
            { dx: 0, dy: -1 }, // 0: Up
            { dx: 1, dy: 0 },  // 1: Right
            { dx: 0, dy: 1 },  // 2: Down
            { dx: -1, dy: 0 }  // 3: Left
        ];

        for (const [key, tile] of this.grid) {
            const [x, y] = key.split(',').map(Number);
            const myConns = tile.getConnections();

            for (const dir of myConns) {
                const nx = x + offsets[dir].dx;
                const ny = y + offsets[dir].dy;
                if (!this.getTile(nx, ny)) {
                    return true; // Connection points to nothing -> Open end
                }
            }
        }
        return false;
    }
}
