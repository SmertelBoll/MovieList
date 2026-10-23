// Builds the Updates rows from backend data (what's saved) and TMDB metadata (what exists).
// Pure functions, no requests: they work from the cache and from fresh responses.

import { FOLDER_STATUSES } from '../../utils/folderStatus'
import { cleanCollectionName } from '../../utils/tmdb'

// A collection enters the list only if something from it was watched; watching counts: it's what introduces a
// franchise.
export const SEED_STATUSES = new Set([FOLDER_STATUSES.WATCHING, FOLDER_STATUSES.WATCHED])

// Handled = not new: watched, dropped, skipped. watching/planned are not handled, so they stay in the counters
// (watching is both seed and "new").
// skipped, unlike dropped, doesn't hide the franchise (hasDropped ignores it).
export const HANDLED_STATUSES = new Set([
    FOLDER_STATUSES.WATCHED,
    FOLDER_STATUSES.DROPPED,
    FOLDER_STATUSES.SKIPPED,
])

// Modes: normal ("new releases") and dropped, same logic over a different set. If any part of a franchise is dropped,
// its Timeline is hidden in normal mode and shown only in dropped mode (movies only).
export const VIEWS = { ACTIVE: 'active', DROPPED: 'dropped' }
const hasDroppedPart = (parts) => parts.some((p) => p.hasDropped)
export const isCollectionVisible = (view, parts) => (view === VIEWS.DROPPED ? hasDroppedPart(parts) : !hasDroppedPart(parts))

export const slimTv = (data) => ({
    name: data.name,
    posterPath: data.poster_path,
    status: data.status,
    seasons: (data.seasons || [])
        .filter((s) => s.season_number > 0 && s.episode_count > 0)
        .map((s) => ({
            seasonNumber: s.season_number,
            name: s.name,
            posterPath: s.poster_path,
            airDate: s.air_date || '',
            episodeCount: s.episode_count,
        })),
})

// Released = has a date that isn't in the future. Timeline shows other parts as SOON; Updates neither shows nor counts
// them.
// TMDB dates are yyyy-MM-dd, so string comparison works.
const todayIso = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const isReleased = (date) => Boolean(date) && date <= todayIso()

// Parts in chronological order; no release date (TBA) goes last, like the Timeline on the movie page. An
// empty string would otherwise sort first.
const byReleaseDate = (a, b) => {
    if (!a.releaseDate && !b.releaseDate) return 0
    if (!a.releaseDate) return 1
    if (!b.releaseDate) return -1
    return a.releaseDate.localeCompare(b.releaseDate)
}

export const slimCollection = (data) => ({
    id: data.id,
    name: data.name,
    posterPath: data.poster_path,
    parts: [...(data.parts || [])]
        .map((p) => ({ id: p.id, title: p.title, posterPath: p.poster_path, releaseDate: p.release_date || '' }))
        .sort(byReleaseDate),
})

// Row activity in ms for the "Recently watched" sort: the last watch date only. No date = 0 (sorts last), not the
// edit time: that would put old, undated titles on top.
const toMs = (value) => {
    const t = value ? Date.parse(value) : NaN
    return Number.isNaN(t) ? 0 : t
}

const latestDateOf = (items, dateOf) => items.reduce((max, item) => (dateOf(item) > max ? dateOf(item) : max), '')

export function buildTvRow(entry, meta) {
    const seasons = meta.seasons.filter((s) => isReleased(s.airDate)).map((s) => {
        const watchedEpisodes = entry.watched[String(s.seasonNumber)] || {}
        const unwatchedCount = Math.max(0, s.episodeCount - Object.keys(watchedEpisodes).length)
        return { ...s, watchedEpisodes, unwatchedCount }
    })
    return {
        key: `tv-${entry.tmdbId}`,
        kind: 'tv',
        id: entry.tmdbId,
        mongoId: entry.mongoId,
        folderName: entry.folderName,
        copies: entry.copies,
        customTypes: entry.customTypes || [],
        title: meta.name,
        posterPath: meta.posterPath,
        seasons,
        lastActivity: toMs(entry.lastWatched),
        ...tvTotals(seasons),
    }
}

// Series totals over the shown seasons (specials are filtered out) so "X of Y" are comparable.
function tvTotals(seasons) {
    return {
        unwatchedCount: seasons.reduce((sum, s) => sum + s.unwatchedCount, 0),
        episodeCount: seasons.reduce((sum, s) => sum + s.episodeCount, 0),
        latestDate: latestDateOf(seasons.filter((s) => s.unwatchedCount > 0), (s) => s.airDate),
    }
}

// Updates a shown series with fresh TMDB metadata. What's watched comes from the row on screen, not from the
// response fetched at load: the user may have marked something during the refresh.
export function mergeTvRow(existing, fresh) {
    const seasons = fresh.seasons.map((s) => {
        const shown = existing.seasons.find((x) => x.seasonNumber === s.seasonNumber)
        const watchedEpisodes = shown ? shown.watchedEpisodes : s.watchedEpisodes
        return { ...s, watchedEpisodes, unwatchedCount: Math.max(0, s.episodeCount - Object.keys(watchedEpisodes).length) }
    })
    return { ...existing, title: fresh.title, posterPath: fresh.posterPath, seasons, ...tvTotals(seasons) }
}

export function buildCollectionRow(meta, savedByTmdbId) {
    const parts = [...meta.parts].sort(byReleaseDate).map((part) => {
        const saved = savedByTmdbId.get(part.id)
        return {
            id: part.id,
            title: part.title,
            posterPath: part.posterPath,
            releaseDate: part.releaseDate,
            // Not released yet: not shown or counted in the row, but kept in parts: its saved copy in a
            // dropped folder still hides the franchise.
            upcoming: !isReleased(part.releaseDate),
            status: saved?.status || null,
            hasDropped: Boolean(saved?.hasDropped),
            mongoId: saved?.mongoId || null,
            folderName: saved?.folderName || null,
            saved: saved || null,
        }
    })
    // Planned parts don't count as activity: their dateAdded is when they were added to a folder, not
    // watched.
    const lastActivity = Math.max(0, ...parts
        .filter((p) => p.status && p.status !== FOLDER_STATUSES.PLANNED)
        .map((p) => toMs(p.saved?.dateAdded)))
    return { key: `collection-${meta.id}`, kind: 'collection', id: meta.id, title: cleanCollectionName(meta.name), posterPath: meta.posterPath, parts, lastActivity, ...collectionTotals(parts) }
}

export function collectionTotals(parts) {
    // Only watched/dropped lag behind. What's being watched (watching) or planned stays in the counter with a
    // different icon. Unreleased parts aren't counted.
    const released = parts.filter((p) => !p.upcoming)
    const unwatched = released.filter((p) => !HANDLED_STATUSES.has(p.status))
    return { unwatchedCount: unwatched.length, releasedCount: released.length, latestDate: latestDateOf(unwatched, (p) => p.releaseDate) }
}

// Updates a shown collection: part statuses come from the screen (see mergeTvRow).
export function mergeCollectionRow(existing, fresh) {
    const parts = fresh.parts.map((part) => existing.parts.find((p) => p.id === part.id) ? { ...part, ...pickState(existing.parts.find((p) => p.id === part.id)) } : part)
    return { ...existing, title: fresh.title, posterPath: fresh.posterPath, parts, ...collectionTotals(parts) }
}

const pickState = ({ status, hasDropped, mongoId, folderName, saved }) => ({ status, hasDropped, mongoId, folderName, saved })
