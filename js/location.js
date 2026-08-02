export async function searchLocation(query){

    if(query.length < 3)
        return [];

    const url =
`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`;

    const response = await fetch(url,{
        headers:{
            "Accept":"application/json"
        }
    });

    return await response.json();

}