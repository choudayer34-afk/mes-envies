const ALL_OVERLAY_IDS = [
    "modalOverlay", "deleteModal", "ficheOverlay", "dateModal", "urlModal",
    "adminModal", "templateEditModal", "checklistModal", "assignModal",
    "templatePickerModal", "enviePickerModal", "mapModal", "inboxModal", "agendaModal"
];

export function closeAllOverlaysExcept(exceptId = null) {

    ALL_OVERLAY_IDS.forEach(id => {

        if (id === exceptId)
            return;

        const el = document.getElementById(id);

        if (el) {
            el.classList.add("hidden");
        }

    });

}

export function ouvrirImageAgrandie(url) {

    const modal = document.getElementById("imageAgrandieModal");
    const img = document.getElementById("imageAgrandieSrc");

    if (!modal || !img)
        return;

    img.src = url;
    img.style.transform = "translate(0px, 0px) scale(1)";
    img.dataset.scale = "1";

    modal.classList.remove("hidden");

}

export function initZoomImageViewer() {

    const img = document.getElementById("imageAgrandieSrc");
    const modal = document.getElementById("imageAgrandieModal");

    if (!img || !modal)
        return;

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let dernierPinchDistance = null;
    let dragStartX = 0, dragStartY = 0;
    let dragging = false;

    function appliquer() {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        img.style.cursor = scale > 1 ? "grab" : "default";
    }

    function reinitialiser() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        appliquer();
    }

    modal.addEventListener("click", (event) => {

        if (event.target.id === "imageAgrandieModal") {
            modal.classList.add("hidden");
            reinitialiser();
        }

    });

    img.addEventListener("dblclick", () => {

        scale = scale > 1 ? 1 : 2.5;
        translateX = 0;
        translateY = 0;
        appliquer();

    });

    img.addEventListener("wheel", (event) => {

        event.preventDefault();
        scale = Math.min(4, Math.max(1, scale - event.deltaY * 0.002));
        appliquer();

    });

    img.addEventListener("touchstart", (event) => {

        if (event.touches.length === 2) {

            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            dernierPinchDistance = Math.hypot(dx, dy);

        } else if (event.touches.length === 1 && scale > 1) {

            dragging = true;
            dragStartX = event.touches[0].clientX - translateX;
            dragStartY = event.touches[0].clientY - translateY;

        }

    });

    img.addEventListener("touchmove", (event) => {

        if (event.touches.length === 2 && dernierPinchDistance) {

            event.preventDefault();

            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            const distance = Math.hypot(dx, dy);

            scale = Math.min(4, Math.max(1, scale * (distance / dernierPinchDistance)));
            dernierPinchDistance = distance;

            appliquer();

        } else if (event.touches.length === 1 && dragging) {

            event.preventDefault();

            translateX = event.touches[0].clientX - dragStartX;
            translateY = event.touches[0].clientY - dragStartY;

            appliquer();

        }

    });

    img.addEventListener("touchend", (event) => {

        if (event.touches.length < 2) dernierPinchDistance = null;
        if (event.touches.length === 0) dragging = false;

    });

}

