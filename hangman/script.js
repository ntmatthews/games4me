const MAX_MISSES = 6;
const WORDS = [
	{ word: "ORCHARD", category: "PLACES" },
	{ word: "PLANET", category: "SPACE" },
	{ word: "KETTLE", category: "AT HOME" },
	{ word: "PUZZLE", category: "GAMES" },
	{ word: "HARBOR", category: "PLACES" },
	{ word: "MUSEUM", category: "PLACES" },
	{ word: "COMPASS", category: "THINGS" },
	{ word: "TROPIC", category: "NATURE" },
	{ word: "BICYCLE", category: "TRANSPORT" },
	{ word: "PENGUIN", category: "ANIMALS" },
	{ word: "CINEMA", category: "PLACES" },
	{ word: "VOLCANO", category: "NATURE" },
	{ word: "LIBRARY", category: "PLACES" },
	{ word: "RAINBOW", category: "NATURE" },
];
const PARTS = ["part-head", "part-body", "part-arm-left", "part-arm-right", "part-leg-left", "part-leg-right"];

const categoryElement = document.querySelector("#category");
const missesElement = document.querySelector("#misses");
const stageElement = document.querySelector("#hangman-stage");
const statusElement = document.querySelector("#status");
const wordDisplay = document.querySelector("#word-display");
const keyboard = document.querySelector("#letter-keyboard");
const winsElement = document.querySelector("#wins");
const playedElement = document.querySelector("#played");

let currentWord = null;
let previousWord = "";
let guessedLetters = new Set();
let misses = 0;
let wins = 0;
let played = 0;
let roundState = "playing";

function chooseWord() {
	const availableWords = WORDS.filter(({ word }) => word !== previousWord);
	currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
	previousWord = currentWord.word;
}

function startRound() {
	chooseWord();
	guessedLetters = new Set();
	misses = 0;
	roundState = "playing";
	categoryElement.textContent = currentWord.category;
	statusElement.textContent = "Pick a letter to get started.";
	document.querySelector("#new-word").innerHTML = '<span aria-hidden="true">&#8635;</span> New word';
	buildKeyboard();
	render();
}

function buildKeyboard() {
	keyboard.replaceChildren();
	for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "letter-key";
		button.textContent = letter;
		button.setAttribute("aria-label", `Guess ${letter}`);
		button.dataset.letter = letter;
		button.addEventListener("click", () => guessLetter(letter));
		keyboard.append(button);
	}
}

function guessLetter(letter) {
	const normalizedLetter = letter.toUpperCase();
	if (roundState !== "playing" || guessedLetters.has(normalizedLetter)) return;

	guessedLetters.add(normalizedLetter);
	if (!currentWord.word.includes(normalizedLetter)) misses += 1;

	if ([...currentWord.word].every((character) => guessedLetters.has(character))) {
		roundState = "won";
		wins += 1;
		played += 1;
		statusElement.textContent = `That's it! The word was ${currentWord.word}.`;
	} else if (misses >= MAX_MISSES) {
		roundState = "lost";
		played += 1;
		statusElement.textContent = `No guesses left. The word was ${currentWord.word}.`;
	} else if (currentWord.word.includes(normalizedLetter)) {
		statusElement.textContent = "Good guess. Keep going.";
	} else {
		statusElement.textContent = "Not this time. Try another letter.";
	}

	if (roundState !== "playing") {
		document.querySelector("#new-word").innerHTML = '<span aria-hidden="true">&#8635;</span> Play again';
	}
	render();
}

function render() {
	missesElement.textContent = String(misses);
	winsElement.textContent = String(wins);
	playedElement.textContent = String(played);
	stageElement.setAttribute("data-mistakes", String(misses));
	stageElement.setAttribute("aria-label", `Hangman drawing, ${misses} of ${MAX_MISSES} incorrect guesses`);

	for (const partClass of PARTS) {
		stageElement.querySelector(`.${partClass}`).classList.toggle("is-shown", PARTS.indexOf(partClass) < misses);
	}

	wordDisplay.replaceChildren();
	wordDisplay.setAttribute("aria-label", roundState === "lost" ? `Word: ${currentWord.word}` : "Hidden word");
	for (let index = 0; index < currentWord.word.length; index += 1) {
		const letter = currentWord.word[index];
		const slot = document.createElement("span");
		slot.className = "word-letter";
		slot.textContent = guessedLetters.has(letter) || roundState === "lost" ? letter : "";
		slot.setAttribute("aria-label", `Letter ${index + 1}: ${guessedLetters.has(letter) || roundState === "lost" ? letter : "hidden"}`);
		wordDisplay.append(slot);
	}

	for (const button of keyboard.querySelectorAll(".letter-key")) {
		const letter = button.dataset.letter;
		const guessed = guessedLetters.has(letter);
		button.disabled = guessed || roundState !== "playing";
		if (guessed) {
			const correct = currentWord.word.includes(letter);
			button.classList.toggle("correct", correct);
			button.classList.toggle("incorrect", !correct);
			button.setAttribute("aria-label", `${letter}, ${correct ? "correct" : "incorrect"}`);
		}
	}
}

document.querySelector("#new-word").addEventListener("click", startRound);
document.addEventListener("keydown", (event) => {
	if (/^[a-z]$/i.test(event.key)) guessLetter(event.key);
});

startRound();