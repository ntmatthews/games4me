const WINNING_LINES = [
	[0, 1, 2], [3, 4, 5], [6, 7, 8],
	[0, 3, 6], [1, 4, 7], [2, 5, 8],
	[0, 4, 8], [2, 4, 6],
];

const cells = [...document.querySelectorAll("[data-cell]")];
const statusElement = document.querySelector("#status");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const scores = { X: 0, O: 0, draws: 0 };

let board = Array(9).fill("");
let currentPlayer = "X";
let mode = "two";
let roundOver = false;
let roundId = 0;
let winningCells = [];

function getWinner(position) {
	const line = WINNING_LINES.find(([first, second, third]) => position[first] && position[first] === position[second] && position[first] === position[third]);
	return line ? { player: position[line[0]], line } : null;
}

function startRound() {
	roundId += 1;
	board = Array(9).fill("");
	currentPlayer = "X";
	roundOver = false;
	winningCells = [];
	statusElement.textContent = mode === "computer" ? "Your turn. You're X." : "Player X's turn.";
	render();
}

function render() {
	cells.forEach((cell, index) => {
		const mark = board[index];
		cell.textContent = mark;
		cell.classList.toggle("player-x", mark === "X");
		cell.classList.toggle("player-o", mark === "O");
		cell.classList.toggle("winning", winningCells.includes(index));
		cell.disabled = Boolean(mark) || roundOver || (mode === "computer" && currentPlayer === "O");
		const row = Math.floor(index / 3) + 1;
		const column = (index % 3) + 1;
		cell.setAttribute("aria-label", `Row ${row}, column ${column}, ${mark || "empty"}${winningCells.includes(index) ? ", winning square" : ""}`);
	});

	document.querySelector("#x-score").textContent = String(scores.X);
	document.querySelector("#o-score").textContent = String(scores.O);
	document.querySelector("#draw-score").textContent = String(scores.draws);
}

function finishRound(winner) {
	roundOver = true;
	if (winner) {
		scores[winner.player] += 1;
		winningCells = winner.line;
		statusElement.textContent = mode === "computer" && winner.player === "O" ? "Computer wins this round." : `${winner.player} wins this round!`;
	} else {
		scores.draws += 1;
		statusElement.textContent = "A draw. Nicely matched.";
	}
	render();
}

function playMove(index, fromComputer = false) {
	if (roundOver || board[index] || (mode === "computer" && currentPlayer === "O" && !fromComputer)) return;
	board[index] = currentPlayer;

	const winner = getWinner(board);
	if (winner) {
		finishRound(winner);
		return;
	}
	if (board.every(Boolean)) {
		finishRound(null);
		return;
	}

	currentPlayer = currentPlayer === "X" ? "O" : "X";
	if (mode === "computer" && currentPlayer === "O") {
		statusElement.textContent = "Computer is thinking...";
		render();
		const currentRound = roundId;
		setTimeout(() => {
			if (!roundOver && roundId === currentRound && currentPlayer === "O") {
				const move = findBestComputerMove();
				if (move !== -1) playMove(move, true);
			}
		}, 280);
	} else {
		statusElement.textContent = `Player ${currentPlayer}'s turn.`;
		render();
	}
}

function minimax(position, depth, maximizing) {
	const winner = getWinner(position);
	if (winner?.player === "O") return 10 - depth;
	if (winner?.player === "X") return depth - 10;
	if (position.every(Boolean)) return 0;

	let bestScore = maximizing ? -Infinity : Infinity;
	for (let index = 0; index < position.length; index += 1) {
		if (position[index]) continue;
		position[index] = maximizing ? "O" : "X";
		const score = minimax(position, depth + 1, !maximizing);
		position[index] = "";
		bestScore = maximizing ? Math.max(bestScore, score) : Math.min(bestScore, score);
	}
	return bestScore;
}

function findBestComputerMove() {
	let bestScore = -Infinity;
	let bestMove = -1;
	for (let index = 0; index < board.length; index += 1) {
		if (board[index]) continue;
		board[index] = "O";
		const score = minimax(board, 0, false);
		board[index] = "";
		if (score > bestScore) {
			bestScore = score;
			bestMove = index;
		}
	}
	return bestMove;
}

cells.forEach((cell) => {
	cell.addEventListener("click", () => playMove(Number(cell.dataset.cell)));
});

modeButtons.forEach((button) => {
	button.addEventListener("click", () => {
		mode = button.dataset.mode;
		modeButtons.forEach((modeButton) => {
			const isActive = modeButton === button;
			modeButton.classList.toggle("is-active", isActive);
			modeButton.setAttribute("aria-pressed", String(isActive));
		});
		startRound();
	});
});

document.querySelector("#new-round").addEventListener("click", startRound);
startRound();
