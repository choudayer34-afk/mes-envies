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

function renderVoyagePartage(voyage, enfants, container) {

    container.innerHTML = `
        ${voyage.photoCouverture ? `<img src="${voyage.photoCouverture}" style="width:100%;border-radius:16px;margin-bottom:16px;">` : ""}
        <h2>🧳 ${voyage.titre}</h2>
        <p style="color:var(--color-text-light);margin-bottom:20px;">${voyage.description || ""}</p>
    `;

    const enfantsAvecPhotos = enfants.filter(e => e.realise);

    if (enfantsAvecPhotos.length === 0) {
        container.innerHTML += `<div class="emptyState">Aucun souvenir enregistré pour l'instant.</div>`;
        return;
    }

    enfantsAvecPhotos.forEach(envie => {

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
            <div class="carnetActiviteTitre">${envie.titre}</div>
            ${envie.description ? `<p class="carnetActiviteDescription">${envie.description}</p>` : ""}
            ${photosHtml}
        `;

        container.appendChild(card);

    });

}

init();
