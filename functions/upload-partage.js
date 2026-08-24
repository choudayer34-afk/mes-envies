const CLOUD_NAME = "wz4fkcbs";
const UPLOAD_PRESET = "Envies";

export async function onRequestPost(context) {

    try {

        const formData = await context.request.formData();
        const fichier = formData.get("fichier");

        if (!fichier) {

            return new Response(JSON.stringify({ error: "Aucun fichier reçu" }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });

        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", fichier);
        uploadFormData.append("upload_preset", UPLOAD_PRESET);

        const reponseCloudinary = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
            method: "POST",
            body: uploadFormData
        });

        const data = await reponseCloudinary.json();

        if (!reponseCloudinary.ok) {

            return new Response(JSON.stringify({ error: data.error?.message || "Échec de l'upload" }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });

        }

        return new Response(JSON.stringify({
            url: data.secure_url,
            type: (fichier.type === "application/pdf" || data.resource_type === "raw") ? "pdf" : "image"
        }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (err) {

        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
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
