const searchInput = document.querySelector("#game-search");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const gameCards = [...document.querySelectorAll(".game-card")];
const gameCount = document.querySelector("#game-count");
const emptyState = document.querySelector("#empty-state");

let selectedCategory = "all";

function updateCatalog() {
	const query = searchInput.value.trim().toLowerCase();
	let visibleCount = 0;

	for (const card of gameCards) {
		const matchesCategory = selectedCategory === "all" || card.dataset.category === selectedCategory;
		const matchesSearch = card.dataset.name.includes(query);
		const isVisible = matchesCategory && matchesSearch;

		card.hidden = !isVisible;
		if (isVisible) visibleCount += 1;
	}

	gameCount.textContent = `${visibleCount} ${visibleCount === 1 ? "game" : "games"}`;
	emptyState.hidden = visibleCount !== 0;
}

for (const button of filterButtons) {
	button.addEventListener("click", () => {
		selectedCategory = button.dataset.filter;

		for (const filterButton of filterButtons) {
			const isActive = filterButton === button;
			filterButton.classList.toggle("is-active", isActive);
			filterButton.setAttribute("aria-pressed", String(isActive));
		}

		updateCatalog();
	});
}

searchInput.addEventListener("input", updateCatalog);

document.addEventListener("keydown", (event) => {
	if (event.key === "/" && document.activeElement !== searchInput) {
		event.preventDefault();
		searchInput.focus();
	}
});
