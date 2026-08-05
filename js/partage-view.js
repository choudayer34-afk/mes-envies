import { db } from "./firebase.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const foyerId = params.get("foyer");
const envieId = params.get("id");

const JOUR_COLORS = ["#6FAFC4", "#F5A623", "#E85D75", "#7ED6A5", "#9B7EDE", "#F2C94C", "#4F92A8"];

let categoriesCache = [];

async function chargerCategories() {

    const snap = await getDocs(collection(db, "foyers", foyerId, "envieCategories"));
    categoriesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

}

function getCategorieById(id) {
    return categoriesCache.find(c => c.id === id);
}

async function init() {

    const container = document.getElementById("partageContent");

    if (!foyerId || !envieId) {
        container.innerHTML = `<div class="emptyState">Lien de partage invalide.</div>`;
        return;
    }

    try {

        await chargerCategories();

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

function getGroupKey(envie) {

    if (envie.date?.start) {
        return envie.date.type === "range"
            ? `d_${envie.date.start}_${envie.date.end}`
            : `d_${envie.date.start}`;
    }

    if (envie.jourGroupId)
        return `g_${envie.jourGroupId}`;

    return null;

}

function groupParDate(enfants) {

    const avecGroupe = enfants.filter(e => getGroupKey(e));
    const sansDate = enfants.filter(e => !getGroupKey(e));

    const groupes = {};

    avecGroupe.forEach(e => {

        const key = getGroupKey(e);

        groupes[key] ??= {
            key,
            label: e.date?.start ? formatDatePeriode(e.date) : "🗂️ Jour à planifier",
            items: []
        };

        groupes[key].items.push(e);

    });

    const groupesTries = Object.values(groupes).sort((a, b) => {

        const dateA = a.items[0]?.date?.start || "9999";
        const dateB = b.items[0]?.date?.start || "9999";

        return dateA.localeCompare(dateB);

    });

    return { groupesTries, sansDate };

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
        mapDiv.style.marginBottom = "12px";

        container.appendChild(mapDiv);

        const legendDiv = document.createElement("div");
        legendDiv.id = "partageMapLegend";
        legendDiv.className = "mapLegend";
        legendDiv.style.position = "static";
        legendDiv.style.marginBottom = "24px";

        container.appendChild(legendDiv);

        setTimeout(() => initPartageMap(voyage, lieuxGeolocalises), 100);

    }

    const enfantsAvecPhotos = enfants.filter(e => e.realise || isLogementCategorie(e.categorie));

    function isLogementCategorie(catId) {
        const cat = getCategorieById(catId);
        return cat?.label?.toLowerCase().includes("logement") || false;
    }


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

    const emoji = getCategorieById(envie.categorie)?.emoji || "💡";

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
        <div class="carnetActiviteTitre">${emoji} ${envie.titre}</div>
        ${envie.lieu?.nom ? `<p style="font-size:12px;color:var(--color-text-light);margin-bottom:6px;">📍 ${envie.lieu.nom}</p>` : ""}
        ${envie.description ? `<p class="carnetActiviteDescription">${envie.description}</p>` : ""}
        ${photosHtml}
    `;

    return card;

}

function getJourColor(envie, jourColorMap) {

    const key = getGroupKey(envie);

    if (!key)
        return "#94A3B8";

    if (!jourColorMap.has(key)) {
        jourColorMap.set(key, JOUR_COLORS[jourColorMap.size % JOUR_COLORS.length]);
    }

    return jourColorMap.get(key);

}

function initPartageMap(voyage, lieux) {

    const map = L.map("partageMapContainer");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    const bounds = [];
    const jourColorMap = new Map();

    if (voyage.lieu?.latitude) {

        const marker = L.marker([voyage.lieu.latitude, voyage.lieu.longitude], {
            icon: createPin("#4B5B66", "🧳")
        }).addTo(map);

        marker.bindPopup(`<strong>🧳 ${voyage.titre}</strong>`);

        bounds.push([voyage.lieu.latitude, voyage.lieu.longitude]);

    }

    lieux.forEach(envie => {

        const emoji = getCategorieById(envie.categorie)?.emoji || "💡";
        const couleur = getJourColor(envie, jourColorMap);

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

    renderLegendePartage(lieux, jourColorMap);

}

function renderLegendePartage(lieux, jourColorMap) {

    const legend = document.getElementById("partageMapLegend");

    if (!legend)
        return;

    legend.innerHTML = "";

    if (jourColorMap.size === 0) {
        legend.classList.add("hidden");
        return;
    }

    legend.classList.remove("hidden");

    const labelsParKey = new Map();

    lieux.forEach(envie => {

        const key = getGroupKey(envie);

        if (!key || labelsParKey.has(key))
            return;

        const label = envie.date?.start ? formatDatePeriode(envie.date) : "Jour à planifier";
        labelsParKey.set(key, label);

    });

    jourColorMap.forEach((color, key) => {

        const item = document.createElement("div");
        item.className = "mapLegendItem";
        item.innerHTML = `<span class="mapLegendDot" style="background:${color}"></span> ${labelsParKey.get(key) || ""}`;

        legend.appendChild(item);

    });

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
