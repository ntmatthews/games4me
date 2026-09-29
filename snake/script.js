const BOARD_SIZE = 18;
const TICK_MS = 125;
const BEST_KEY = "games4me-snake-best";

const boardElement = document.querySelector("#board");
const scoreElement = document.querySelector("#score");
const bestElement = document.querySelector("#best-score");
const statusElement = document.querySelector("#status");
const startButton = document.querySelector("#start-button");

const cellElements = [];
let snake = [];
let food = null;
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let bestScore = readBestScore();
let gameState = "ready";
let loopHandle = null;

function readBestScore() {
	try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
}

function saveBestScore(value) {
	try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* Storage may be unavailable in private browsing. */ }
}

function createBoard() {
	boardElement.replaceChildren();
	for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
		const cell = document.createElement("div");
		cell.className = "board-cell";
		cell.setAttribute("role", "presentation");
		cellElements.push(cell);
		boardElement.append(cell);
	}
}

function startNewGame() {
	clearInterval(loopHandle);
	snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
	direction = { x: 1, y: 0 };
	nextDirection = { x: 1, y: 0 };
	score = 0;
	food = placeFood();
	gameState = "playing";
	scoreElement.textContent = "000";
	statusElement.textContent = "Keep moving. Don't hit the edges.";
	startButton.textContent = "Pause";
	drawBoard();
	loopHandle = setInterval(tick, TICK_MS);
	boardElement.focus({ preventScroll: true });
}

function placeFood() {
	const emptyCells = [];
	for (let y = 0; y < BOARD_SIZE; y += 1) {
		for (let x = 0; x < BOARD_SIZE; x += 1) {
			if (!snake.some((segment) => segment.x === x && segment.y === y)) emptyCells.push({ x, y });
		}
	}
	return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function tick() {
	direction = nextDirection;
	const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
	const eating = head.x === food.x && head.y === food.y;
	const collisionBody = eating ? snake : snake.slice(0, -1);

	if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE || collisionBody.some((segment) => segment.x === head.x && segment.y === head.y)) {
		endGame();
		return;
	}

	snake.unshift(head);
	if (eating) {
		score += 10;
		if (score > bestScore) {
			bestScore = score;
			saveBestScore(bestScore);
		}
		food = placeFood();
		scoreElement.textContent = String(score).padStart(3, "0");
		bestElement.textContent = String(bestScore).padStart(3, "0");
	} else {
		snake.pop();
	}

	drawBoard();
}

function endGame() {
	clearInterval(loopHandle);
	gameState = "over";
	statusElement.textContent = `Game over. You scored ${score}.`;
	startButton.textContent = "Play again";
}

function drawBoard() {
	for (const cell of cellElements) cell.className = "board-cell";
	snake.forEach((segment, index) => {
		const cell = cellElements[segment.y * BOARD_SIZE + segment.x];
		cell.classList.add("snake-segment");
		if (index === 0) cell.classList.add("snake-head");
	});
	if (food) cellElements[food.y * BOARD_SIZE + food.x].classList.add("food");
}

function setDirection(x, y) {
	if (x === -direction.x && y === -direction.y) return;
	nextDirection = { x, y };
}

function handleDirection(x, y) {
	if (gameState === "ready") startNewGame();
	if (gameState === "playing") setDirection(x, y);
}

function togglePause() {
	if (gameState === "playing") {
		clearInterval(loopHandle);
		gameState = "paused";
		statusElement.textContent = "Paused. Take a breath.";
		startButton.textContent = "Resume";
	} else if (gameState === "paused") {
		gameState = "playing";
		statusElement.textContent = "Keep moving. Don't hit the edges.";
		startButton.textContent = "Pause";
		loopHandle = setInterval(tick, TICK_MS);
		boardElement.focus({ preventScroll: true });
	} else {
		startNewGame();
	}
}

startButton.addEventListener("click", togglePause);
document.querySelector("#restart-button").addEventListener("click", startNewGame);
document.querySelectorAll("[data-direction]").forEach((button) => {
	button.addEventListener("click", () => {
		const directions = {
			up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
		};
		handleDirection(...directions[button.dataset.direction]);
	});
});

document.addEventListener("keydown", (event) => {
	const key = event.key.toLowerCase();
	const directions = {
		arrowup: [0, -1], w: [0, -1],
		arrowdown: [0, 1], s: [0, 1],
		arrowleft: [-1, 0], a: [-1, 0],
		arrowright: [1, 0], d: [1, 0],
	};

	if (directions[key]) {
		event.preventDefault();
		handleDirection(...directions[key]);
	} else if (event.code === "Space" && !event.repeat && !event.target.closest("button")) {
		event.preventDefault();
		togglePause();
	}
});

bestElement.textContent = String(bestScore).padStart(3, "0");
createBoard();
snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
food = placeFood();
drawBoard();
statusElement.textContent = "Press start or use an arrow key.";
