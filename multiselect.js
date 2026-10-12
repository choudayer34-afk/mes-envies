export function renderMultiSelectCollapsible(containerId, items, selectedValues, onChange) {

    const container = document.getElementById(containerId);

    if (!container)
        return;

    const resume = selectedValues.size > 0
        ? `${selectedValues.size} sélectionné${selectedValues.size > 1 ? "s" : ""}`
        : "Aucun";

    container.innerHTML = `
        <button type="button" class="dateButton multiSelectToggle">
            <span>${resume}</span>
            <span>▾</span>
        </button>
        <div class="categorieSelector multiSelectGrid" style="margin-top:10px;display:none;"></div>
    `;

    const toggle = container.querySelector(".multiSelectToggle");
    const grid = container.querySelector(".multiSelectGrid");

    let ouvert = false;

    items.forEach(item => {

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "categorieChip" + (selectedValues.has(item.label) ? " active" : "");
        chip.innerHTML = `<span style="font-size:24px;">${item.emoji}</span><span>${item.label}</span>`;

        chip.addEventListener("click", () => {

            if (selectedValues.has(item.label)) {
                selectedValues.delete(item.label);
            } else {
                selectedValues.add(item.label);
            }

            chip.classList.toggle("active");

            toggle.querySelector("span").textContent = selectedValues.size > 0
                ? `${selectedValues.size} sélectionné${selectedValues.size > 1 ? "s" : ""}`
                : "Aucun";

            onChange(selectedValues);

        });

        grid.appendChild(chip);

    });

    toggle.addEventListener("click", () => {

        ouvert = !ouvert;
        grid.style.display = ouvert ? "grid" : "none";

    });

}
