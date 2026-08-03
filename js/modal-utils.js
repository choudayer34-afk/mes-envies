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
