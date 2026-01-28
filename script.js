// --- Game Setup and Constants ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// UI Elements
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

// The canvas is 600x600. We grid it into 30x30 tiles.
const CANVAS_SIZE = 600;
const TILE_COUNT = 30; // How many tiles across/down
const TILE_SIZE = CANVAS_SIZE / TILE_COUNT - 2; // Size of one square (minus gap)

// --- Game Variables ---
let score = 0;
let snake = [];
let food = { x: 0, y: 0 };

// Direction variables (dx = change in x, dy = change in y)
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;

let gameLoopId = null; // Stores the interval ID to stop the loop later
let isGameRunning = false;
let currentSpeed = 100; // Default Medium

// --- Difficulty Handling ---
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove selected class from all
        difficultyBtns.forEach(b => b.classList.remove('selected'));
        // Add to clicked
        btn.classList.add('selected');
        // Update speed
        currentSpeed = parseInt(btn.dataset.speed);
    });
});

// --- Game Initialization ---
function initGame() {
    // 1. Create the initial snake (3 parts long)
    snake = [
        { x: 10, y: 10 }, // Head
        { x: 10, y: 11 }, // Body
        { x: 10, y: 12 }  // Tail
    ];

    // 2. Reset score and movement
    score = 0;
    dx = 0;
    dy = -1; // Moving UP initially
    nextDx = 0;
    nextDy = -1;
    scoreElement.textContent = score;

    // 3. Place the first food
    placeFood();

    // 4. Start the game loop
    isGameRunning = true;
    if (gameLoopId) clearInterval(gameLoopId);
    // Use currentSpeed for the interval
    gameLoopId = setInterval(gameLoop, currentSpeed);

    // 5. Hide the UI overlays
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
}

// --- Game Over Logic ---
function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoopId); // Stop the loop
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden'); // Show Game Over screen
}

// --- Food Logic ---
function placeFood() {
    // Keep finding a random spot until it's NOT on the snake
    while (true) {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };

        // Check if food spawned on snake body
        let onSnake = false;
        for (let part of snake) {
            if (part.x === food.x && part.y === food.y) {
                onSnake = true;
                break;
            }
        }
        if (!onSnake) break; // Found a valid spot
    }
}

// --- Update Logic (Runs every frame) ---
function update() {
    // 1. Update direction from buffer (prevents conflicting key presses)
    // only if it's not a complete reversal (going back on yourself)
    if ((nextDx !== 0 && nextDx !== -dx) || (nextDy !== 0 && nextDy !== -dy)) {
        dx = nextDx;
        dy = nextDy;
    }

    // 2. Calculate new head position
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 3. Check Wall Collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    // 4. Check Self Collision
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

    // 5. Move Snake
    snake.unshift(head); // Add new head to start of array

    // 6. Check Food Collision
    if (head.x === food.x && head.y === food.y) {
        // Ate food!
        score += 10;
        scoreElement.textContent = score;
        placeFood(); // Spawn new food
        // We DON'T remove the tail, so the snake grows longer
    } else {
        // Didn't eat, so remove the tail to maintain length
        snake.pop();
    }
}

// --- Drawing Logic ---
function draw() {
    // 1. Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Food (Red)
    ctx.fillStyle = '#ff4757';
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 10; // Glowing effect
    const foodX = food.x * (CANVAS_SIZE / TILE_COUNT) + 1;
    const foodY = food.y * (CANVAS_SIZE / TILE_COUNT) + 1;
    ctx.beginPath();
    ctx.roundRect(foodX, foodY, TILE_SIZE, TILE_SIZE, 4);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset glow

    // 3. Draw Snake (Green)
    snake.forEach((part, index) => {
        // Head is brighter
        if (index === 0) {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
            ctx.shadowBlur = 0;
        }

        const partX = part.x * (CANVAS_SIZE / TILE_COUNT) + 1;
        const partY = part.y * (CANVAS_SIZE / TILE_COUNT) + 1;

        ctx.beginPath();
        ctx.roundRect(partX, partY, TILE_SIZE, TILE_SIZE, 4);
        ctx.fill();
    });
}

// --- Main Game Loop ---
function gameLoop() {
    update();
    if (isGameRunning) {
        draw();
    }
}

// --- Input Handling ---
document.addEventListener('keydown', (e) => {
    // Prevent default scrolling for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }

    // Set 'next' direction based on key press
    // Actual direction updates in the game loop to prevent bugs
    switch (e.key) {
        case 'ArrowUp':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowDown':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'ArrowLeft':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowRight':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
    }
});

// --- Button Listeners ---
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

if (document.getElementById('menuBtn')) {
    document.getElementById('menuBtn').addEventListener('click', showMainMenu);
}

if (document.getElementById('headerMenuBtn')) {
    document.getElementById('headerMenuBtn').addEventListener('click', () => {
        isGameRunning = false;
        if (gameLoopId) clearInterval(gameLoopId);
        showMainMenu();
    });
}

// --- Menu Functions ---
function showMainMenu() {
    isGameRunning = false;
    if (gameLoopId) clearInterval(gameLoopId);

    // Hide Game Over / Game Screens
    gameOverScreen.classList.add('hidden');

    // Show Start Screen
    startScreen.classList.remove('hidden');

    // Reset visually
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Initial render (shows empty board)
draw();
