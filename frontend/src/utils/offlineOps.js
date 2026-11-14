// Changes to a series made while the server may be unreachable. Each op carries the request to send and enough data to
// show its effect on the Updates data: the page shows a change at once and re-applies it over fresher server data until
// the request has been sent. The endpoints behind these ops set values rather than add to them, so sending an op twice
// (a request that timed out but reached the server) is harmless.

export const episodeSetOp = (mongoId, season, episode, values) => ({
    type: 'episode-set',
    mongoId,
    season,
    episode,
    values,
    request: { method: 'patch', url: `/tv/${mongoId}/season/${season}/episode/${episode}`, data: values },
})

export const episodeDeleteOp = (mongoId, season, episode) => ({
    type: 'episode-delete',
    mongoId,
    season,
    episode,
    request: { method: 'delete', url: `/tv/${mongoId}/season/${season}/episode/${episode}` },
})

export const seasonWatchedOp = (mongoId, season, episodes, dateAdded) => ({
    type: 'season-watched',
    mongoId,
    season,
    episodes,
    dateAdded,
    request: { method: 'patch', url: `/tv/${mongoId}/season/${season}/watched`, data: { episodes, dateAdded } },
})

const latest = (a, b) => {
    if (!a) return b || null
    if (!b) return a
    return new Date(a) >= new Date(b) ? a : b
}

const toIso = (value) => (value ? new Date(value).toISOString() : null)

function applyToEntry(entry, op) {
    const season = String(op.season)
    const watched = { ...entry.watched, [season]: { ...entry.watched[season] } }
    let lastWatched = entry.lastWatched

    if (op.type === 'episode-set') {
        const dateAdded = toIso(op.values.dateAdded)
        watched[season][String(op.episode)] = { ...op.values, dateAdded }
        lastWatched = latest(lastWatched, dateAdded)
    } else if (op.type === 'episode-delete') {
        delete watched[season][String(op.episode)]
    } else if (op.type === 'season-watched') {
        // Like the server: only episodes without a record (a skipped one has a record and stays skipped)
        for (const number of op.episodes) {
            const key = String(number)
            if (!watched[season][key]) {
                watched[season][key] = { dateAdded: op.dateAdded, watchedCount: 1, rating: null, comment: '' }
            }
        }
        lastWatched = latest(lastWatched, toIso(op.dateAdded))
    }
    return { ...entry, watched, lastWatched }
}

// The /updates response with the unsent ops applied on top of it.
export function applyPendingToUpdates(data, ops) {
    const mine = ops.filter((op) => op.mongoId)
    if (!mine.length) return data
    const tv = data.results.tv.map((entry) => {
        const forEntry = mine.filter((op) => op.mongoId === entry.mongoId)
        return forEntry.length ? forEntry.reduce(applyToEntry, entry) : entry
    })
    return { ...data, results: { ...data.results, tv } }
}
