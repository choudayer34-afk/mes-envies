import { db } from "./firebase.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const foyerId = params.get("foyer");
const envieId = params.get("id");

async function init() {

    const container = document.getElementById("partageContent");

    if (!foyerId || !envieId) {
        container.innerHTML = `<div class="emptyState">Lien de partage invalide.</div>`;
        return;
    }

    try {

        const snap = await getDoc(doc(db, "foyers", foyerId, "envies", envieId));

        if (!snap.exists() || !snap.data().partagePublic) {
            container.innerHTML = `<div class="emptyState">Ce voyage n'est plus partagé ou n'existe pas.</div>`;
            return;
        }

        const voyage = { id: snap.id, ...snap.data() };

        const q = query(collection(db, "foyers", foyerId, "envies"), where("voyageId", "==", envieId));
        const enfantsSnap = await getDocs(q);
        const enfants = enfantsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        renderVoyagePartage(voyage, enfants, container);

    } catch (err) {

        container.innerHTML = `<div class="emptyState">Erreur de chargement.</div>`;
        console.error(err);

    }

}

function formatDatePeriode(date) {

    if (!date?.start)
        return "";

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    if (date.type === "range" && date.end) {
        return `Du ${formatDate(date.start)} au ${formatDate(date.end)}`;
    }

    return formatDate(date.start);

}

function groupParDate(enfants) {

    const avecDate = enfants.filter(e => e.date?.start);
    const sansDate = enfants.filter(e => !e.date?.start);

    const groupes = {};

    avecDate.forEach(e => {

        const key = e.date.type === "range" ? `${e.date.start}_${e.date.end}` : e.date.start;

        groupes[key] ??= { label: formatDatePeriode(e.date), items: [] };
        groupes[key].items.push(e);

    });

    const groupesTries = Object.values(groupes).sort((a, b) =>
        avecDate.find(e => formatDatePeriode(e.date) === a.label)?.date.start.localeCompare(
            avecDate.find(e => formatDatePeriode(e.date) === b.label)?.date.start
        )
    );

    return { groupesTries, sansDate };

}

function isLogement(envie) {
    return (envie.categorie || "").toLowerCase().includes("logement");
}

function renderVoyagePartage(voyage, enfants, container) {

    const periodeLabel = formatDatePeriode(voyage.date);

    container.innerHTML = `
        ${voyage.photoCouverture ? `<img src="${voyage.photoCouverture}" style="width:100%;border-radius:16px;margin-bottom:16px;">` : ""}
        <h2>🧳 ${voyage.titre}</h2>
        ${periodeLabel ? `<p style="color:var(--color-primary-dark);font-weight:600;margin-bottom:8px;">📅 ${periodeLabel}</p>` : ""}
        ${voyage.description ? `<p style="color:var(--color-text-light);margin-bottom:20px;">${voyage.description}</p>` : ""}
        ${voyage.lieu?.nom ? `<p style="color:var(--color-text-light);margin-bottom:20px;">📍 ${voyage.lieu.nom}</p>` : ""}
    `;

    const lieuxGeolocalises = enfants.filter(e => e.lieu?.latitude && e.lieu?.longitude);

    if (lieuxGeolocalises.length > 0 || voyage.lieu?.latitude) {

        const mapDiv = document.createElement("div");
        mapDiv.id = "partageMapContainer";
        mapDiv.style.height = "280px";
        mapDiv.style.borderRadius = "16px";
        mapDiv.style.marginBottom = "24px";

        container.appendChild(mapDiv);

        setTimeout(() => initPartageMap(voyage, lieuxGeolocalises), 100);

    }

    const enfantsAvecPhotos = enfants.filter(e => e.realise);

    if (enfantsAvecPhotos.length === 0) {
        container.innerHTML += `<div class="emptyState">Aucun souvenir enregistré pour l'instant.</div>`;
        return;
    }

    const { groupesTries, sansDate } = groupParDate(enfantsAvecPhotos);

    groupesTries.forEach(groupe => {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = groupe.label;
        container.appendChild(header);

        groupe.items.forEach(envie => {
            container.appendChild(createCartePartage(envie));
        });

    });

    if (sansDate.length > 0) {

        const header = document.createElement("div");
        header.className = "checklistCategorieHeader";
        header.textContent = "Autres souvenirs";
        container.appendChild(header);

        sansDate.forEach(envie => {
            container.appendChild(createCartePartage(envie));
        });

    }

}

function createCartePartage(envie) {

    const card = document.createElement("div");
    card.className = "carnetActiviteCard";

    let photosHtml = "";

    if (envie.photos && envie.photos.length > 0) {

        photosHtml = `<div class="carnetPhotosGrid">`;

        envie.photos.forEach(photo => {

            const thumbUrl = photo.url.replace("/upload/", "/upload/w_400,h_400,c_fill,q_auto/");

            photosHtml += `
                <div class="carnetPhotoItem">
                    <img src="${thumbUrl}" loading="lazy">
                    ${photo.description ? `<div class="carnetPhotoLegende">${photo.description}</div>` : ""}
                </div>
            `;

        });

        photosHtml += `</div>`;

    }

    card.innerHTML = `
        <div class="carnetActiviteTitre">${isLogement(envie) ? "🏨" : "💡"} ${envie.titre}</div>
        ${envie.lieu?.nom ? `<p style="font-size:12px;color:var(--color-text-light);margin-bottom:6px;">📍 ${envie.lieu.nom}</p>` : ""}
        ${envie.description ? `<p class="carnetActiviteDescription">${envie.description}</p>` : ""}
        ${photosHtml}
    `;

    return card;

}

function initPartageMap(voyage, lieux) {

    const map = L.map("partageMapContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    const bounds = [];

    if (voyage.lieu?.latitude) {

        const marker = L.marker([voyage.lieu.latitude, voyage.lieu.longitude], {
            icon: createPin("#6FAFC4", "🧳")
        }).addTo(map);

        marker.bindPopup(`<strong>🧳 ${voyage.titre}</strong>`);

        bounds.push([voyage.lieu.latitude, voyage.lieu.longitude]);

    }

    lieux.forEach(envie => {

        const emoji = isLogement(envie) ? "🏨" : "📍";
        const couleur = isLogement(envie) ? "#F5A623" : "#6FAFC4";

        const marker = L.marker([envie.lieu.latitude, envie.lieu.longitude], {
            icon: createPin(couleur, emoji)
        }).addTo(map);

        marker.bindPopup(`<strong>${emoji} ${envie.titre}</strong>`);

        bounds.push([envie.lieu.latitude, envie.lieu.longitude]);

    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] });
    } else {
        map.setView([46.6, 2.3], 5);
    }

}

function createPin(color, emoji) {

    return L.divIcon({
        className: "custom-map-pin",
        html: `
            <div style="
                background:${color};
                width:30px;height:30px;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 6px rgba(0,0,0,.3);
                border:2px solid white;
            ">
                <span style="transform:rotate(45deg);font-size:14px;">${emoji}</span>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

}

init();
