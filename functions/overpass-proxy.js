const OVERPASS_SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter"
];

export async function onRequestPost(context) {

    const origine = context.request.headers.get("Origin") || context.request.headers.get("Referer") || "";

    if (!origine.includes("mes-envies.pages.dev")) {

        return new Response(JSON.stringify({ error: "Origine non autorisée" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
        });

    }

    try {

        const { query } = await context.request.json();

        if (!query || typeof query !== "string") {

            return new Response(JSON.stringify({ error: "Requête Overpass manquante" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });

        }

        let derniereErreur = null;

        for (const server of OVERPASS_SERVERS) {

            try {

                const body = new URLSearchParams();
                body.set("data", query);

                const response = await fetch(server, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "User-Agent": "EnVie-App/1.0 (contact via mes-envies.pages.dev)"
                    },
                    body: body.toString()
                });

                const text = await response.text();

                if (response.ok) {

                    return new Response(text, {
                        status: 200,
                        headers: {
                            "Content-Type": response.headers.get("Content-Type") || "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });

                }

                derniereErreur = `${server} → HTTP ${response.status}: ${text.substring(0, 200)}`;

            } catch (error) {

                derniereErreur = `${server} → ${error.message}`;

            }

        }

        return new Response(JSON.stringify({ error: "Tous les serveurs Overpass ont échoué", details: derniereErreur }), {
            status: 502,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (error) {

        return new Response(JSON.stringify({ error: "Erreur du proxy Overpass", details: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    }

}

export async function onRequestOptions() {

    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });

}
