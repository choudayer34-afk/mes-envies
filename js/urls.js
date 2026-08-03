export function renderUrls(envie) {

    const urlList = document.getElementById("urlList");
    urlList.innerHTML = "";

    (envie.urls || []).forEach(link => {

        const div = document.createElement("div");
        div.className = "urlItem";

        div.innerHTML = `<a href="${link.url}" target="_blank">${link.url}</a>`;

        urlList.appendChild(div);

    });

}


export function addUrl(){

}

export function deleteUrl(){


}