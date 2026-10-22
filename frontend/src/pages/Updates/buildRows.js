// Побудова рядків сторінки Updates із даних бекенда (що збережено) і метаданих TMDB (що існує).
// Чисті функції без запитів — вони працюють і з кешу, і зі свіжих відповідей.

import { FOLDER_STATUSES } from '../../utils/folderStatus'
import { cleanCollectionName } from '../../utils/tmdb'

// Колекція потрапляє в список, тільки якщо з неї щось дивилися.
// watching тут є — саме він вводить франшизу в список.
export const SEED_STATUSES = new Set([FOLDER_STATUSES.WATCHING, FOLDER_STATUSES.WATCHED])

// Опрацьоване — не рахується як нове: переглянуте й кинуте.
// watching і planned сюди НЕ входять: фільм ще не подивилися, тож він
// лишається в лічильниках. Через це watching водночас і затравка, і "нове".
// skipped теж опрацьоване (свідомо пропущена частина не «нова»), але на відміну від dropped
// не ховає франшизу й не має власного режиму — hasDropped його не враховує.
export const HANDLED_STATUSES = new Set([
    FOLDER_STATUSES.WATCHED,
    FOLDER_STATUSES.DROPPED,
    FOLDER_STATUSES.SKIPPED,
])

// Режими сторінки: звичайний («нові релізи») і по кинутих — та сама логіка, інший набір.
// Якщо хоча б одна частина франшизи кинута (є в папці зі статусом dropped), увесь Timeline у звичайному режимі
// не показується, у режимі dropped — навпаки, показані лише вони. Це правило для фільмів; серіали живуть за своєю логікою.
export const VIEWS = { ACTIVE: 'active', DROPPED: 'dropped' }
const hasDroppedPart = (parts) => parts.some((p) => p.hasDropped)
export const isCollectionVisible = (view, parts) => (view === VIEWS.DROPPED ? hasDroppedPart(parts) : !hasDroppedPart(parts))

// ---- Метадані TMDB у стислому вигляді (саме це кешується) ----

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

export const slimCollection = (data) => ({
    id: data.id,
    name: data.name,
    posterPath: data.poster_path,
    parts: [...(data.parts || [])]
        .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
        .map((p) => ({ id: p.id, title: p.title, posterPath: p.poster_path, releaseDate: p.release_date || '' })),
})

// ---- Рядки ----

const latestDateOf = (items, dateOf) => items.reduce((max, item) => (dateOf(item) > max ? dateOf(item) : max), '')

/** Серіал: entry — що збережено (бекенд), meta — що на TMDB. */
export function buildTvRow(entry, meta) {
    const seasons = meta.seasons.map((s) => {
        const watchedEpisodes = entry.watched[String(s.seasonNumber)] || {}
        // Сезон переглянутий, лише якщо переглянуті ВСІ серії
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
        ...tvTotals(seasons),
    }
}

// Підсумки серіалу — по сезонах, що показуються (спецвипуски відфільтровані), щоб «X з Y» були співмірні
function tvTotals(seasons) {
    return {
        unwatchedCount: seasons.reduce((sum, s) => sum + s.unwatchedCount, 0),
        episodeCount: seasons.reduce((sum, s) => sum + s.episodeCount, 0),
        latestDate: latestDateOf(seasons.filter((s) => s.unwatchedCount > 0), (s) => s.airDate),
    }
}

/**
 * Оновлення вже показаного серіалу свіжими метаданими TMDB. Що серії переглянуті, береться з рядка на екрані,
 * а не з відповіді, отриманої при завантаженні: за час фонового оновлення користувач міг щось позначити.
 */
export function mergeTvRow(existing, fresh) {
    const seasons = fresh.seasons.map((s) => {
        const shown = existing.seasons.find((x) => x.seasonNumber === s.seasonNumber)
        const watchedEpisodes = shown ? shown.watchedEpisodes : s.watchedEpisodes
        return { ...s, watchedEpisodes, unwatchedCount: Math.max(0, s.episodeCount - Object.keys(watchedEpisodes).length) }
    })
    return { ...existing, title: fresh.title, posterPath: fresh.posterPath, seasons, ...tvTotals(seasons) }
}

/** Колекція фільмів: meta — склад колекції на TMDB, savedByTmdbId — що з неї збережено (бекенд). */
export function buildCollectionRow(meta, savedByTmdbId) {
    const parts = meta.parts.map((part) => {
        const saved = savedByTmdbId.get(part.id)
        return {
            id: part.id,
            title: part.title,
            posterPath: part.posterPath,
            releaseDate: part.releaseDate,
            // null — не збережений; інакше статус папки
            status: saved?.status || null,
            hasDropped: Boolean(saved?.hasDropped),
            mongoId: saved?.mongoId || null,
            folderName: saved?.folderName || null,
            // Дані збереженого документа — щоб редагування відкривалось заповненим
            saved: saved || null,
        }
    })
    return { key: `collection-${meta.id}`, kind: 'collection', id: meta.id, title: cleanCollectionName(meta.name), posterPath: meta.posterPath, parts, ...collectionTotals(parts) }
}

function collectionTotals(parts) {
    // Позаду лише переглянуте й кинуте. Те, що дивляться зараз (watching) або заплановане (planned),
    // лишається в лічильнику — просто з іншою іконкою.
    const unwatched = parts.filter((p) => !HANDLED_STATUSES.has(p.status))
    return { unwatchedCount: unwatched.length, latestDate: latestDateOf(unwatched, (p) => p.releaseDate) }
}

/** Оновлення показаної колекції: статуси частин беремо з екрана (див. mergeTvRow). */
export function mergeCollectionRow(existing, fresh) {
    const parts = fresh.parts.map((part) => existing.parts.find((p) => p.id === part.id) ? { ...part, ...pickState(existing.parts.find((p) => p.id === part.id)) } : part)
    return { ...existing, title: fresh.title, posterPath: fresh.posterPath, parts, ...collectionTotals(parts) }
}

const pickState = ({ status, hasDropped, mongoId, folderName, saved }) => ({ status, hasDropped, mongoId, folderName, saved })
