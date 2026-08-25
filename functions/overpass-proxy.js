const MIRRORS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter"
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

        for (const miroir of MIRRORS) {

            try {

                const reponse = await fetch(miroir, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: "data=" + encodeURIComponent(query)
                });

                if (reponse.ok) {

                    const data = await reponse.json();

                    return new Response(JSON.stringify(data), {
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                    });

                }

            } catch (err) {

                console.error(`Miroir ${miroir} échoué: ${err.message}`);

            }

        }

        return new Response(JSON.stringify({ error: "Tous les miroirs Overpass ont échoué" }), {
            status: 502,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {

        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });

    }

}

export async function onRequestOptions() {

    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });

}
