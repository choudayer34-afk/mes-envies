export function getGroupKey(envie) {

    if (envie.date?.start) {
        return envie.date.type === "range"
            ? `d_${envie.date.start}_${envie.date.end}`
            : `d_${envie.date.start}`;
    }

    if (envie.jourGroupId)
        return `g_${envie.jourGroupId}`;

    return null;

}

export function groupAndSort(envies) {

    const withGroup = envies.filter(e => getGroupKey(e));
    const todo = envies.filter(e => !getGroupKey(e)).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    const map = {};

    withGroup.forEach(envie => {

        const key = getGroupKey(envie);

        map[key] ??= { key, isDated: !!envie.date?.start, date: envie.date, items: [] };
        map[key].items.push(envie);

    });

    const groups = Object.values(map);

    groups.forEach(g => g.items.sort((a, b) => (a.ordre || 0) - (b.ordre || 0)));

    const dated = groups.filter(g => g.isDated)
        .sort((a, b) => new Date(b.date.start) - new Date(a.date.start));

    const adhoc = groups.filter(g => !g.isDated)
        .sort((a, b) => {
            const minA = Math.min(...a.items.map(i => i.ordre || 0));
            const minB = Math.min(...b.items.map(i => i.ordre || 0));
            return minA - minB;
        });

    dated.forEach(g => { g.label = formatDateLabel(g.date); });
    adhoc.forEach((g, i) => { g.label = `🗂️ Jour ${i + 1}`; });

    return { groups: [...dated, ...adhoc], todo };

}

export function formatDateLabel(date) {

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    if (date.type === "range" && date.end)
        return `Du ${formatDate(date.start)} au ${formatDate(date.end)}`;

    return formatDate(date.start);

}


