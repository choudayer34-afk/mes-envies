export function makeRowDraggable(row, envieId, onDrop) {

    const handle = row.querySelector(".dragHandle");

    if (!handle)
        return;

    handle.addEventListener("pointerdown", (startEvent) => {

        startEvent.preventDefault();

        const rect = row.getBoundingClientRect();

        const clone = row.cloneNode(true);
        clone.classList.add("draggingClone");
        clone.style.position = "fixed";
        clone.style.width = rect.width + "px";
        clone.style.left = rect.left + "px";
        clone.style.top = rect.top + "px";
        clone.style.pointerEvents = "none";
        clone.style.zIndex = "9999";
        clone.style.opacity = "0.9";

        document.body.appendChild(clone);
        row.style.opacity = "0.3";

        function move(e) {

            clone.style.left = (e.clientX - rect.width / 2) + "px";
            clone.style.top = (e.clientY - 24) + "px";

            document.querySelectorAll(".dragOverTarget").forEach(el => el.classList.remove("dragOverTarget"));

            const under = document.elementFromPoint(e.clientX, e.clientY);
            const targetRow = under?.closest("[data-drag-id]");

            if (targetRow && targetRow.dataset.dragId !== envieId) {
                targetRow.classList.add("dragOverTarget");
            }

        }

        function up(e) {

            document.removeEventListener("pointermove", move);
            document.removeEventListener("pointerup", up);

            clone.remove();
            row.style.opacity = "1";

            document.querySelectorAll(".dragOverTarget").forEach(el => el.classList.remove("dragOverTarget"));

            const under = document.elementFromPoint(e.clientX, e.clientY);
            const targetRow = under?.closest("[data-drag-id]");

            if (targetRow && targetRow.dataset.dragId !== envieId) {
                onDrop(targetRow.dataset.dragId);
            }

        }

        document.addEventListener("pointermove", move);
        document.addEventListener("pointerup", up);

    });

}
