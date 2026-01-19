import { CONSTANTS } from './constants.js';

export class Tile {
    constructor(type) {
        this.type = type;
        this.rotation = 0; // 0, 1, 2, 3 (each represents 90 degrees clockwise)
    }

    rotate() {
        this.rotation = (this.rotation + 1) % 4;
    }

    setRotation(r) {
        this.rotation = r % 4;
    }

    /**
     * Returns an array of directions (0-3) that this tile connects to.
     * Directions: 0: Up, 1: Right, 2: Down, 3: Left
     */
    getConnections() {
        if (this.type === CONSTANTS.TILE_STRAIGHT) {
            // Straight tile
            // Rot 0 or 2: Up (0) and Down (2)
            // Rot 1 or 3: Right (1) and Left (3)
            if (this.rotation % 2 === 0) {
                return [CONSTANTS.DIR_UP, CONSTANTS.DIR_DOWN];
            } else {
                return [CONSTANTS.DIR_RIGHT, CONSTANTS.DIR_LEFT];
            }
        } else if (this.type === CONSTANTS.TILE_CURVE) {
            // Curve tile (L-shape)
            // Let's define base (Rot 0) as Bottom-Right (2, 1)
            // Rot 0:  Bottom (2), Right (1)
            // Rot 1:  Left (3), Bottom (2)
            // Rot 2:  Top (0), Left (3)
            // Rot 3:  Right (1), Top (0)

            // Base connections for Rot 0: [1, 2]
            const base = [1, 2];
            return base.map(d => (d + this.rotation) % 4);
        }
        return [];
    }
}
