import { CONSTANTS } from './constants.js';
import { Tile } from './tile.js';

export class UI {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Offset for scrolling/panning (future proofing)
        this.offsetX = 0;
        this.offsetY = 0;
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        // Re-render if game state exists (will be handled by main loop or event)
        // For now, just clear
        this.clear();
    }

    clear() {
        this.ctx.fillStyle = CONSTANTS.COLOR_BG;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }

    drawGrid() {
        const size = CONSTANTS.TILE_SIZE;
        this.ctx.strokeStyle = CONSTANTS.COLOR_GRID;
        this.ctx.lineWidth = 1;

        // Calculate visible range based on offset
        // For now, assume centered or 0,0
        // Let's draw a large enough grid

        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.beginPath();
        for (let x = 0; x <= w; x += size) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
        }
        for (let y = 0; y <= h; y += size) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
        }
        this.ctx.stroke();
    }

    /**
     * Draw a tile at a specific board coordinate (grid x, y)
     */
    drawTileAt(gridX, gridY, tile) {
        const px = gridX * CONSTANTS.TILE_SIZE + this.offsetX;
        const py = gridY * CONSTANTS.TILE_SIZE + this.offsetY;
        this.drawTileResource(this.ctx, px, py, CONSTANTS.TILE_SIZE, tile);
    }

    /**
     * Core drawing function for a tile on any context
     */
    drawTileResource(ctx, x, y, size, tile) {
        ctx.save();

        // Background
        ctx.fillStyle = CONSTANTS.COLOR_TILE_BASE;
        ctx.fillRect(x, y, size, size);

        // Border
        ctx.strokeStyle = CONSTANTS.COLOR_TILE_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, size, size);

        // Water Canal
        ctx.strokeStyle = CONSTANTS.COLOR_WATER;
        ctx.lineWidth = size * 0.3; // Water width (30% of tile)
        ctx.lineCap = 'butt';

        const center = size / 2;

        ctx.translate(x + center, y + center);
        ctx.rotate(tile.rotation * Math.PI / 2);
        ctx.translate(-center, -center);

        ctx.beginPath();
        if (tile.type === CONSTANTS.TILE_STRAIGHT) {
            // Straight: Vertical (after rotation applied)
            // Wait, my Tile logic says:
            // Straight Rot 0: Up-Down.
            // If I draw a vertical line, that corresponds to Up-Down. Correct.
            ctx.moveTo(center, 0);
            ctx.lineTo(center, size);
        } else if (tile.type === CONSTANTS.TILE_CURVE) {
            // Curve: Base is Bottom-Right (2, 1)
            // So we need to connect (size/2, size) to (size, size/2)
            // We can do this with an arc center at (size, size) radius size/2
            ctx.arc(size, size, size / 2, Math.PI, 1.5 * Math.PI);
            // Math.PI (180 deg) is Left (relative to center), 1.5 PI (270) is Top.
            // Wait. Center of arc is (size, size) i.e. Bottom-Right corner.
            // Angle PI points Left -> (0, size). Incorrect.

            // Let's trace it carefully.
            // We want to connect Bottom edge (center, size) to Right edge (size, center).
            // Arc center (size, size).
            // Start angle: PI (180 deg) -> points to (size - r, size) = (size/2, size) = Bottom edge center. Correct.
            // End angle: 1.5 PI (270 deg) -> points to (size, size - r) = (size, size/2) = Right edge center. Correct.
            // Counter-clockwise? No, 180 to 270 is clockwise.
        }
        ctx.stroke();

        ctx.restore();
    }
}
