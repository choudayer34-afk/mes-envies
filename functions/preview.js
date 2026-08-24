export async function onRequestGet(context) {

    const origine = context.request.headers.get("Origin") || context.request.headers.get("Referer") || "";

if (!origine.includes("mes-envies.pages.dev")) {

    return new Response(JSON.stringify({ error: "Origine non autorisée" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
    });

}
    
    const url = new URL(context.request.url);
    const cible = url.searchParams.get("url");

    if (!cible) {
        return new Response(JSON.stringify({ error: "URL manquante" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {

        const reponse = await fetch(cible, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; EnVieBot/1.0)" },
            redirect: "follow"
        });

        const html = await reponse.text();
        const finalUrl = reponse.url;

        const extraireMeta = (propriete) => {

            let match = html.match(new RegExp(`<meta[^>]+property=["']${propriete}["'][^>]+content=["']([^"']+)["']`, "i"));

            if (!match) {
                match = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propriete}["']`, "i"));
            }

            return match ? match[1] : null;

        };

        const titreBalise = (html.match(/<title>([^<]+)<\/title>/i) || [])[1];

        const data = {
            title: extraireMeta("og:title") || titreBalise || null,
            image: extraireMeta("og:image"),
            description: extraireMeta("og:description"),
            finalUrl
        };

        return new Response(JSON.stringify(data), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (err) {

        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });

    }

}
