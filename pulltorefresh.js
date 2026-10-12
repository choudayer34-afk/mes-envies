let pullStartY = 0;
let pullDistance = 0;
let pullActif = false;
let elementScrollable = null;

const SEUIL_DECLENCHEMENT = 70;
const DISTANCE_MAX_AFFICHEE = 120;

function trouverScrollableAncestor(element) {

    let el = element;

    while (el && el !== document.body) {

        const style = getComputedStyle(el);

        if ((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
            return el;
        }

        el = el.parentElement;

    }

    return document.scrollingElement || document.documentElement;

}

export function initPullToRefresh() {

    const indicateur = document.createElement("div");
    indicateur.id = "pullToRefreshIndicateur";
    indicateur.className = "pullToRefreshIndicateur";
    indicateur.textContent = "🔄 Tire pour actualiser";
    document.body.appendChild(indicateur);

    document.addEventListener("touchstart", (event) => {

        elementScrollable = trouverScrollableAncestor(event.target);

        if (elementScrollable.scrollTop <= 0) {
            pullStartY = event.touches[0].clientY;
            pullActif = true;
        } else {
            pullActif = false;
        }

    }, { passive: true });

    document.addEventListener("touchmove", (event) => {

        if (!pullActif)
            return;

        pullDistance = event.touches[0].clientY - pullStartY;

        if (pullDistance > 0 && elementScrollable.scrollTop <= 0) {

            const distanceAffichee = Math.min(pullDistance, DISTANCE_MAX_AFFICHEE);

            indicateur.style.transform = `translateY(${distanceAffichee}px)`;
            indicateur.style.opacity = Math.min(distanceAffichee / SEUIL_DECLENCHEMENT, 1);
            indicateur.textContent = distanceAffichee > SEUIL_DECLENCHEMENT ? "🔄 Relâche pour actualiser" : "🔄 Tire pour actualiser";

        } else {

            pullActif = false;
            indicateur.style.opacity = "0";

        }

    }, { passive: true });

    document.addEventListener("touchend", () => {

        if (!pullActif)
            return;

        if (pullDistance > SEUIL_DECLENCHEMENT) {

            indicateur.textContent = "🔄 Actualisation...";
            indicateur.style.transform = `translateY(${SEUIL_DECLENCHEMENT}px)`;
            window.location.reload();

        } else {

            indicateur.style.transform = "translateY(0)";
            indicateur.style.opacity = "0";

        }

        pullActif = false;
        pullDistance = 0;

    });

}
