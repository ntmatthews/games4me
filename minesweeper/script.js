const ROWS = 9;
const COLS = 9;
const MINE_TOTAL = 10;

const boardElement = document.querySelector("#board");
const mineCountElement = document.querySelector("#mine-count");
const timerElement = document.querySelector("#timer");
const statusElement = document.querySelector("#status");
const flagModeButton = document.querySelector("#flag-mode");
const restartButton = document.querySelector("#restart");

let cells = [];
let firstClick = true;
let gameState = "ready";
let flagMode = false;
let seconds = 0;
let timerHandle = null;
let explodedIndex = -1;

function resetGame() {
	clearInterval(timerHandle);
	cells = Array.from({ length: ROWS * COLS }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false }));
	firstClick = true;
	gameState = "ready";
	seconds = 0;
	timerHandle = null;
	explodedIndex = -1;
	setFlagMode(false);
	timerElement.textContent = "000";
	statusElement.textContent = "Choose a square to begin.";
	render();
}

function neighbors(index) {
	const row = Math.floor(index / COLS);
	const col = index % COLS;
	const result = [];

	for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
		for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
			if (rowOffset === 0 && colOffset === 0) continue;
			const nextRow = row + rowOffset;
			const nextCol = col + colOffset;
			if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) {
				result.push(nextRow * COLS + nextCol);
			}
		}
	}

	return result;
}

function placeMines(firstIndex) {
	const safeArea = new Set([firstIndex, ...neighbors(firstIndex)]);
	const available = cells.map((_, index) => index).filter((index) => !safeArea.has(index));

	for (let mineIndex = 0; mineIndex < MINE_TOTAL; mineIndex += 1) {
		const choice = Math.floor(Math.random() * available.length);
		cells[available.splice(choice, 1)[0]].mine = true;
	}

	for (let index = 0; index < cells.length; index += 1) {
		if (!cells[index].mine) {
			cells[index].adjacent = neighbors(index).filter((neighbor) => cells[neighbor].mine).length;
		}
	}

	firstClick = false;
	gameState = "playing";
	timerHandle = setInterval(() => {
		seconds += 1;
		timerElement.textContent = String(seconds).padStart(3, "0");
	}, 1000);
}

function reveal(index) {
	const cell = cells[index];
	if (!cell || cell.revealed || cell.flagged || gameState === "won" || gameState === "lost") return;

	if (firstClick) placeMines(index);
	cell.revealed = true;

	if (cell.mine) {
		gameState = "lost";
		explodedIndex = index;
		clearInterval(timerHandle);
		cells.forEach((item) => { if (item.mine) item.revealed = true; });
		statusElement.textContent = "Boom. Start a new game and try again.";
	} else if (cell.adjacent === 0) {
		for (const neighbor of neighbors(index)) reveal(neighbor);
	}

	const safeCellsRevealed = cells.filter((item) => item.revealed && !item.mine).length;
	if (gameState === "playing" && safeCellsRevealed === cells.length - MINE_TOTAL) {
		gameState = "won";
		clearInterval(timerHandle);
		statusElement.textContent = "Field clear. Nicely done!";
	} else if (gameState === "playing") {
		statusElement.textContent = "Keep going. Watch the numbers.";
	}

	render();
}

function toggleFlag(index) {
	const cell = cells[index];
	if (!cell || cell.revealed || gameState === "won" || gameState === "lost") return;
	if (!cell.flagged && cells.filter((item) => item.flagged).length >= MINE_TOTAL) return;
	cell.flagged = !cell.flagged;
	if (gameState === "ready") statusElement.textContent = "Flags placed. Choose a square to begin.";
	render();
}

function setFlagMode(enabled) {
	flagMode = enabled;
	flagModeButton.setAttribute("aria-pressed", String(flagMode));
}

function render() {
	const flaggedCount = cells.filter((cell) => cell.flagged).length;
	mineCountElement.textContent = String(MINE_TOTAL - flaggedCount).padStart(2, "0");
	boardElement.replaceChildren();

	cells.forEach((cell, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "cell";
		button.setAttribute("role", "gridcell");
		button.setAttribute("aria-label", `Row ${Math.floor(index / COLS) + 1}, column ${index % COLS + 1}${cell.revealed ? cell.mine ? ", mine" : cell.adjacent ? `, ${cell.adjacent} adjacent mines` : ", empty" : cell.flagged ? ", flagged" : ", hidden"}`);

		if (cell.revealed) {
			button.classList.add("revealed");
			if (cell.mine) {
				button.textContent = "*";
				if (index === explodedIndex) button.classList.add("mine-hit");
			} else if (cell.adjacent > 0) {
				button.textContent = String(cell.adjacent);
				button.dataset.count = String(cell.adjacent);
			}
		} else if (cell.flagged) {
			button.textContent = "!";
			button.classList.add("flagged");
		}

		button.disabled = gameState === "won" || gameState === "lost";
		button.addEventListener("click", () => flagMode ? toggleFlag(index) : reveal(index));
		button.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			toggleFlag(index);
		});
		boardElement.append(button);
	});
}

flagModeButton.addEventListener("click", () => setFlagMode(!flagMode));
restartButton.addEventListener("click", resetGame);
document.addEventListener("keydown", (event) => {
	if (event.key.toLowerCase() === "f" && !event.repeat) setFlagMode(!flagMode);
});

resetGame();
