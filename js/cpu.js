import { CONSTANTS } from './constants.js';
import { Solver } from './solver.js';

export class CPU {
    constructor(game, level = 1) {
        this.game = game;
        this.level = level;
        this.thinking = false;
    }

    async takeTurn() {
        if (this.thinking) return;
        this.thinking = true;

        // Simulate thinking time
        await new Promise(r => setTimeout(r, 1000));

        try {
            // Decide 1-3 moves
            // For now, always do at least 1 move if possible.
            // Loop 1 to 3 times
            let movesMade = 0;
            const maxMoves = Math.floor(Math.random() * 3) + 1; // Randomly decide 1-3 moves target

            while (movesMade < maxMoves && this.game.movesInTurn.length < 3 && this.game.deck.length > 0) {
                const moved = await this.makeMove();
                if (!moved) break;
                movesMade++;

                // Small pause between moves
                await new Promise(r => setTimeout(r, 500));
            }

            // Finish turn
            if (this.game.movesInTurn.length > 0) {
                this.game.switchTurn();
            } else {
                // If couldn't move (no valid moves?), pass or game over?
                // Logic in Game should handle "no valid moves".
                // For now, force switch to prevent hang.
                console.log("CPU could not move.");
                this.game.switchTurn();
            }
        } finally {
            this.thinking = false;
        }
    }

    async makeMove() {
        // Get valid placements
        // 1. Scan board bounds + padding
        const candidates = this.getValidPlacements();

        if (candidates.length === 0) {
            // Check if rotation helps? getValidPlacements checks current rotation.
            // We should check ALL rotations.
            // But current logic: CPU holds a specific tile with specific rotation?
            // No, Game.currentTile has a rotation. CPU can rotate it.

            // Brute force: Try all 4 rotations
            for (let r = 0; r < 3; r++) { // Try rotating
                this.game.rotateCurrentTile();
                const newCandidates = this.getValidPlacements();
                if (newCandidates.length > 0) {
                    return this.executeMove(newCandidates[0]);
                }
            }
            return false;
        }

        // Pick random candidate for Level 1
        const choice = candidates[Math.floor(Math.random() * candidates.length)];
        return this.executeMove(choice);
    }

    getValidPlacements() {
        const candidates = [];
        const board = this.game.board;
        // Search area: Bounds + 1
        const range = 1;
        const minX = board.minX - range;
        const maxX = board.maxX + range;
        const minY = board.minY - range;
        const maxY = board.maxY + range;

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (board.isValidPlacement(x, y, this.game.currentTile)) { // Board rules
                    if (this.game.isValidTurnConstraint(x, y)) { // Turn rules
                        candidates.push({ x, y });
                    }
                }
            }
        }
        return candidates;
    }

    executeMove(pos) {
        this.game.handleClickSimulation(pos.x, pos.y);
        return true;
    }
}
