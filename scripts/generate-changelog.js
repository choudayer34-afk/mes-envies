const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE || '';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const FOYER_ID = process.env.FOYER_ID;

const lines = COMMIT_MESSAGE.split('\n').map(l => l.trim());
const titre = lines[0] || 'Mise à jour';
const items = lines.slice(1).filter(l => l.length > 0);

if (items.length === 0) {
    console.log("Pas de description étendue sur ce commit, changelog non modifié.");
    process.exit(0);
}

const projectId = "mes-envies-21527";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/foyers/${FOYER_ID}/changelog?key=${FIREBASE_API_KEY}`;

const now = new Date();

const body = {
    fields: {
        titre: { stringValue: titre },
        items: { arrayValue: { values: items.map(i => ({ stringValue: i })) } },
        date: { integerValue: now.getTime().toString() },
        version: { stringValue: now.toISOString() }
    }
};

const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

if (!response.ok) {
    const errorText = await response.text();
    console.error("Erreur Firestore:", errorText);
    process.exit(1);
}

console.log(`Changelog publié avec la date réelle du déploiement : ${now.toISOString()}`);
