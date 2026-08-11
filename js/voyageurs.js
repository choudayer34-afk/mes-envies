import { updatePersonneDateNaissance, calculerAgeDepuisNaissance } from "./storage.js";

export function renderVoyageursWidget(containerId) {

    const container = document.getElementById(containerId);

    if (!container)
        return;

    container.innerHTML = `
        <div style="display:flex;gap:10px;margin-bottom:10px;">
            <div style="flex:1;">
                <label class="fieldTitle">Adultes</label>
                <input type="number" class="voyageursAdultes" min="1" value="2" style="width:100%;height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--color-border);box-sizing:border-box;">
            </div>
            <div style="flex:1;">
                <label class="fieldTitle">Enfants</label>
                <input type="number" class="voyageursEnfants" min="0" value="0" style="width:100%;height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--color-border);box-sizing:border-box;">
            </div>
            <div style="flex:1;">
                <label class="fieldTitle">Chambres</label>
                <input type="number" class="voyageursChambres" min="1" value="1" style="width:100%;height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--color-border);box-sizing:border-box;">
            </div>
        </div>
        <div class="voyageursAgesContainer"></div>
    `;

    const enfantsInput = container.querySelector(".voyageursEnfants");
    const agesContainer = container.querySelector(".voyageursAgesContainer");
function renderAges() {

        const nb = parseInt(enfantsInput.value, 10) || 0;

        agesContainer.innerHTML = "";

        if (nb === 0)
            return;

        const label = document.createElement("label");
        label.className = "fieldTitle";
        label.textContent = "Âge de chaque enfant";
        agesContainer.appendChild(label);

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.gap = "8px";
        row.style.flexWrap = "wrap";
        row.style.marginBottom = "10px";

        const agesConnus = getPersonnes()
            .map(p => calculerAgeDepuisNaissance(p.dateNaissance))
            .filter(age => age !== null && age < 18)
            .sort((a, b) => a - b);

        for (let i = 0; i < nb; i++) {

            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.max = "17";
            input.placeholder = `Âge ${i + 1}`;
            input.className = "voyageursAgeInput";
            input.style = "width:80px;height:44px;padding:0 10px;border-radius:12px;border:1px solid var(--color-border);box-sizing:border-box;text-align:center;";

            if (agesConnus[i] !== undefined) {
                input.value = agesConnus[i];
            }

            row.appendChild(input);

        }

        agesContainer.appendChild(row);

    }

    enfantsInput.addEventListener("input", renderAges);

}

export function getVoyageursData(containerId) {

    const container = document.getElementById(containerId);

    if (!container) {
        return { adultes: 2, enfants: 0, ages: [], chambres: 1 };
    }

    const adultes = parseInt(container.querySelector(".voyageursAdultes")?.value, 10) || 2;
    const enfants = parseInt(container.querySelector(".voyageursEnfants")?.value, 10) || 0;
    const chambres = parseInt(container.querySelector(".voyageursChambres")?.value, 10) || 1;

    const ages = Array.from(container.querySelectorAll(".voyageursAgeInput"))
        .map(input => parseInt(input.value, 10))
        .filter(age => !isNaN(age));

    return { adultes, enfants, ages, chambres };

}

export function formatVoyageursTexte({ adultes, enfants, ages }) {

    let texte = `${adultes} adulte${adultes > 1 ? "s" : ""}`;

    if (enfants > 0) {

        texte += `, ${enfants} enfant${enfants > 1 ? "s" : ""}`;

        if (ages.length > 0) {
            texte += ` (${ages.map(a => `${a} an${a > 1 ? "s" : ""}`).join(", ")})`;
        }

    }

    return texte;

}

export function formatVoyageursCozycozy({ adultes, enfants, ages, chambres }) {

    let code = `${adultes}-${enfants}-${chambres}`;

    if (ages.length > 0) {
        code += `:${ages.join("-")}`;
    }

    return code;

}
