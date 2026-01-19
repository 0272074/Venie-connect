import { CONSTANTS } from './constants.js';
import { Board } from './board.js';
import { Tile } from './tile.js';
import { UI } from './ui.js';
import { Solver } from './solver.js';
import { CPU } from './cpu.js';

export class Game {
    constructor() {
        this.board = new Board();
        this.ui = new UI('game-canvas');
        this.previewUI = new UI('preview-canvas'); // Reuse UI class for preview

        this.currentPlayer = 1;
        this.movesInTurn = []; // Tracks coordinates placed this turn

        // Initialize Deck: 16 tiles total (8 Straight, 8 Curve for balance)
        this.deck = [];
        for (let i = 0; i < 8; i++) this.deck.push(CONSTANTS.TILE_STRAIGHT);
        for (let i = 0; i < 8; i++) this.deck.push(CONSTANTS.TILE_CURVE);
        this.shuffleDeck();

        this.currentTile = null; // The tile currently held by player

        // CPU Setup
        this.isCpuGame = true; // Default to P2 = CPU
        this.cpu = new CPU(this);

        this.setupInput();
        this.startTurn();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    setupInput() {
        // UI Buttons
        document.getElementById('btn-rotate').onclick = () => this.rotateCurrentTile();
        document.getElementById('btn-pass').onclick = () => this.handlePass();
        document.getElementById('btn-impossible').onclick = () => this.handleImpossible();

        // Modal Buttons
        document.getElementById('btn-restart').onclick = () => location.reload();
        document.getElementById('btn-close-modal').onclick = () => {
            document.getElementById('result-modal').classList.add('hidden');
        };

        // Canvas Interaction
        this.ui.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.ui.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.ui.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.rotateCurrentTile();
        });
    }

    startTurn() {
        this.movesInTurn = [];
        this.updatePlayerDisplay();

        if (this.deck.length === 0) {
            // No more tiles. If no loop, game ends. Draw?
            this.showResult('Draw', 'No pieces left and no loop formed.');
            return;
        }

        this.drawTile();
        this.updateButtonStates();

        // Trigger CPU if P2
        if (this.currentPlayer === 2 && this.isCpuGame) {
            this.cpu.takeTurn();
        }
    }

    drawTile() {
        if (this.deck.length > 0) {
            const type = this.deck.pop();
            this.currentTile = new Tile(type);
            this.updatePreview();
            this.render();
        } else {
            this.currentTile = null;
            this.updatePreview();
            // Force end turn if logic allows, or game over handled elsewhere
        }
    }

    handlePass() {
        if (this.isCpuGame && this.currentPlayer === 2) return; // Ignore input if CPU turn
        // Pass button acts as "Finish Turn" if moves made, or "Pass" (skip) if no moves?
        // Rules say 1-3 tiles. So MUST place at least 1?
        // "1〜3枚を直線上に並べて置く" -> Place 1 to 3. 0 is not 1-3.
        // So cannot pass without placing at least 1?
        // "パスボタン（任意）" -> Optional Pass button.
        // Usually in Venice Connection, you can choose not to place? No, you place 1-3.
        // Maybe "Pass" is for when you CANNOT move?
        // Let's assume Pass is "Confirm Move" if > 0 moves.

        if (this.movesInTurn.length > 0) {
            this.switchTurn();
        } else {
            // Can we pass without placing? Assuming no for now based on "1-3".
            // Unless there are no valid moves?
            // Alert user?
            console.log("Must place at least 1 tile.");
        }
    }

    handleImpossible() {
        if (this.isCpuGame && this.currentPlayer === 2) return; // Ignore input if CPU turn
        // Only allowed at start of turn? Or anytime.
        // Logic: Check if remaining deck + current tile can form loop.

        let straights = 0;
        let curves = 0;

        // Count deck
        this.deck.forEach(t => {
            if (t === CONSTANTS.TILE_STRAIGHT) straights++;
            else curves++;
        });

        // Count current holding tile if exists
        if (this.currentTile) {
            if (this.currentTile.type === CONSTANTS.TILE_STRAIGHT) straights++;
            else curves++;
        }

        // Run Solver
        const possible = Solver.isPossible(this.board, straights, curves);

        const winner = this.currentPlayer;
        const loser = this.currentPlayer === 1 ? 2 : 1;

        if (!possible) {
            // Impossible is TRUE. Declaration SUCCESS.
            this.showResult(`Player ${winner} Wins!`, 'Correctly declared Impossible!');
        } else {
            // Impossible is FALSE. Declaration FAILED.
            this.showResult(`Player ${loser} Wins!`, 'Incorrect declaration. A loop is still possible!');
        }
    }

    rotateCurrentTile() {
        if (this.isCpuGame && this.currentPlayer === 2 && !this.cpu.thinking) return; // Block manual rotate during CPU turn except if CPU calls it? 
        // CPU class calls `this.game.rotateCurrentTile()`. 
        // If I block it, CPU can't rotate.
        // So I should allow if CPU is thinking? Or just rely on CPU not clicking buttons.
        // If user clicks button during CPU turn?
        // I should block USER input.

        if (this.currentTile) {
            this.currentTile.rotate();
            this.updatePreview();
            this.render();
        }
    }

    handleMouseMove(e) {
        if (this.isCpuGame && this.currentPlayer === 2) return; // Hide hover?

        const rect = this.ui.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const gx = Math.floor((mx - this.ui.offsetX) / CONSTANTS.TILE_SIZE);
        const gy = Math.floor((my - this.ui.offsetY) / CONSTANTS.TILE_SIZE);

        this.hoverGridX = gx;
        this.hoverGridY = gy;
        this.render();
    }

    handleClick(e) {
        if (this.isCpuGame && this.currentPlayer === 2) return; // Block user click
        if (!this.currentTile) return;

        // Validation
        // 1. Board placement validation
        if (!this.board.isValidPlacement(this.hoverGridX, this.hoverGridY, this.currentTile)) return;

        // 2. Turn constraint validation
        if (!this.isValidTurnConstraint(this.hoverGridX, this.hoverGridY)) return;

        // Place it
        this.placeTile(this.hoverGridX, this.hoverGridY);
    }

    // Called by CPU
    handleClickSimulation(x, y) {
        this.placeTile(x, y);
    }

    isValidTurnConstraint(x, y) {
        // If first move, safe (isValidPlacement handles adjacency)
        if (this.movesInTurn.length === 0) return true;

        if (this.movesInTurn.length >= 3) return false; // Max 3

        const last = this.movesInTurn[this.movesInTurn.length - 1];

        // Must be adjacent to LAST placed tile
        const dx = Math.abs(x - last.x);
        const dy = Math.abs(y - last.y);
        const dist = dx + dy;

        if (dist !== 1) return false; // Not partial adjacent

        // Linearity Check
        // If 2nd move, it defines the line (Horizontal or Vertical).
        // If 3rd move, must match that line.

        if (this.movesInTurn.length === 1) {
            // 2nd move defines direction. Always valid if adjacent.
            return true;
        }

        if (this.movesInTurn.length === 2) {
            const first = this.movesInTurn[0];
            const second = this.movesInTurn[1];

            // Check linearity
            const isVertical = (first.x === second.x);
            const isHorizontal = (first.y === second.y);

            if (isVertical && x === first.x) return true;
            if (isHorizontal && y === first.y) return true;

            return false;
        }

        return true;
    }

    placeTile(x, y) {
        const newTile = new Tile(this.currentTile.type);
        newTile.setRotation(this.currentTile.rotation);

        this.board.placeTile(x, y, newTile);
        this.movesInTurn.push({ x, y });

        // Check WIN immediate
        if (!this.board.hasOpenEnds()) {
            this.render();
            this.showResult(`Player ${this.currentPlayer} Wins!`, 'Loop Completed!');
            return;
        }

        // Draw next tile if available and limit not reached
        if (this.movesInTurn.length < 3 && this.deck.length > 0) {
            this.drawTile();
            this.updateButtonStates();
        } else {
            // Auto finish turn if max moves reached or deck empty
            this.switchTurn();
        }
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.startTurn();
    }

    updateButtonStates() {
        const passBtn = document.getElementById('btn-pass');
        const impBtn = document.getElementById('btn-impossible');

        // Update Pass button text
        if (this.movesInTurn.length > 0) {
            passBtn.textContent = "確定 (Finish)";
            passBtn.className = "btn btn-primary"; // Highlight
        } else {
            passBtn.textContent = "パス (Pass)";
            passBtn.className = "btn btn-secondary";
        }

        // Impossible btn: only if 0 moves made? Usually strict rule.
        // Assuming you can only declare at start of turn.
        if (this.movesInTurn.length > 0) {
            impBtn.disabled = true;
            impBtn.style.opacity = 0.5;
        } else {
            impBtn.disabled = false;
            impBtn.style.opacity = 1;
        }
    }

    updatePlayerDisplay() {
        document.getElementById('p1-display').classList.toggle('active', this.currentPlayer === 1);
        document.getElementById('p2-display').classList.toggle('active', this.currentPlayer === 2);
        document.getElementById('message-area').textContent = `Player ${this.currentPlayer} の手番です`;

        // Log turn start if fresh
        if (this.movesInTurn.length === 0) {
            this.log(`Player ${this.currentPlayer} Turn Start`);
        }
    }

    log(msg) {
        const logArea = document.getElementById('game-log-content');
        const p = document.createElement('p');
        p.className = 'log-entry';
        p.textContent = msg;
        logArea.prepend(p);
    }

    updatePreview() {
        const ctx = this.previewUI.ctx;
        const w = this.previewUI.canvas.width;
        const h = this.previewUI.canvas.height;
        ctx.fillStyle = CONSTANTS.COLOR_BG; // Clear
        ctx.fillRect(0, 0, w, h);

        if (this.currentTile) {
            const size = CONSTANTS.TILE_SIZE;
            const x = (w - size) / 2;
            const y = (h - size) / 2;
            this.previewUI.drawTileResource(ctx, x, y, size, this.currentTile);
        }
    }

    render() {
        this.ui.clear();
        this.board.grid.forEach((tile, key) => {
            const [x, y] = key.split(',').map(Number);
            this.ui.drawTileAt(x, y, tile);
        });

        if (this.hoverGridX !== undefined && this.currentTile && this.board.isValidPlacement(this.hoverGridX, this.hoverGridY, this.currentTile)) {
            if (this.isValidTurnConstraint(this.hoverGridX, this.hoverGridY)) {
                this.ui.ctx.globalAlpha = 0.6;
                this.ui.drawTileAt(this.hoverGridX, this.hoverGridY, this.currentTile);
                this.ui.ctx.globalAlpha = 1.0;

                // Highlight
                this.ui.ctx.strokeStyle = CONSTANTS.COLOR_HOVER_VALID;
                this.ui.ctx.lineWidth = 3;
                const hx = this.hoverGridX * CONSTANTS.TILE_SIZE + this.ui.offsetX;
                const hy = this.hoverGridY * CONSTANTS.TILE_SIZE + this.ui.offsetY;
                this.ui.ctx.strokeRect(hx, hy, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
            }
        }
    }

    showResult(title, message) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('result-modal').classList.remove('hidden');
        this.log(`GAME OVER: ${title} - ${message}`);
    }
}
