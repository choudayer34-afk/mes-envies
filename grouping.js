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


export function groupForAgenda(envies) {

    const dated = envies.filter(e => e.date?.start && !e.realise);
    const adhocSource = envies.filter(e => e.jourGroupId);
    const todo = envies.filter(e => !e.date?.start && !e.jourGroupId);

    const datedMap = {};

    dated.forEach(envie => {

        const key = getGroupKey(envie);

        datedMap[key] ??= { key, date: envie.date, items: [] };
        datedMap[key].items.push(envie);

    });

    const datedGroups = Object.values(datedMap)
        .sort((a, b) => new Date(a.date.start) - new Date(b.date.start));

    datedGroups.forEach(g => {
        g.items.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        g.label = formatDateLabel(g.date);
    });

    const adhocMap = {};

    adhocSource.forEach(envie => {
        adhocMap[envie.jourGroupId] ??= { key: envie.jourGroupId, items: [] };
        adhocMap[envie.jourGroupId].items.push(envie);
    });

    const adhocGroups = Object.values(adhocMap);

    adhocGroups.forEach((g, i) => {
        g.items.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
        g.label = `🗂️ Jour ${i + 1}`;
    });

    todo.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    return { datedGroups, adhocGroups, todo };

}

