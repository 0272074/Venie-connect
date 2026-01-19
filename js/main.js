import { Game } from './game.js';

console.log('Venice Connection initialized');

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new Game();
        console.log('Game initialized successfully');
    } catch (e) {
        console.error('Game initialization failed:', e);
        const div = document.getElementById('debug-error-log');
        if (div) {
            div.style.display = 'block';
            div.innerHTML += `Init Error: ${e.message}\nStack: ${e.stack}\n\n`;
        }
    }
});
