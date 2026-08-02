import { Box, CircularProgress, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import { getTmdbLanguage } from '../../utils/languages'
import { cleanCollectionName } from '../../utils/tmdb'
import { toDateOnlyISO } from '../../utils/dates'
import { FOLDER_STATUSES } from '../../utils/folderStatus'
import { NO_TAG } from '../../redux/slices/ConfigSlice'
import DropdownMenu from '../../components/_customMUI/DropdownMenu'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import SeasonEpisodeDialog from '../../components/SeasonEpisodeDialog/SeasonEpisodeDialog'
import UpdateRow from './UpdateRow'

import CheckIcon from '@mui/icons-material/Check'
import SortIcon from '@mui/icons-material/Sort'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const TMDB = process.env.REACT_APP_URL_TMDB

// TMDB не має пакетного ендпоінта, тож на кожен фільм/серіал іде свій запит.
// Обмежуємо паралельність, щоб не впертися в ліміт і не забити мережу.
const CONCURRENCY = 8

async function mapLimit(items, limit, fn) {
    const results = new Array(items.length)
    let cursor = 0
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++
            results[index] = await fn(items[index], index)
        }
    })
    await Promise.all(workers)
    return results
}

// Колекція потрапляє в список, тільки якщо з неї щось дивилися.
// watching тут є — саме він вводить франшизу в список.
const SEED_STATUSES = new Set([FOLDER_STATUSES.WATCHING, FOLDER_STATUSES.WATCHED])

// Опрацьоване — не рахується як нове: переглянуте й кинуте.
// watching і planned сюди НЕ входять: фільм ще не подивилися, тож він
// лишається в лічильниках. Через це watching водночас і затравка, і "нове".
const HANDLED_STATUSES = new Set([
    FOLDER_STATUSES.WATCHED,
    FOLDER_STATUSES.DROPPED,
])

const SORT_OPTIONS = [
    { key: 'new', label: 'Most new first' },
    { key: 'recent', label: 'Newest release' },
    { key: 'title', label: 'Title A–Z' },
]

function UpdatesPage() {
    const isAuth = useSelector(selectIsAuth)
    const { language, typeTMDB, customTypes } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)

    const [isLoading, setIsLoading] = useState(true)
    const [rows, setRows] = useState([])
    const [sortBy, setSortBy] = useState('new')

    // Папки потрібні діалогу збереження (він показує сайдбар з вибором папки)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    // Діалог фільму (додати / редагувати)
    const [movieDialog, setMovieDialog] = useState(null) // { mode, item, folder }
    // Діалог серії
    const [episodeDialog, setEpisodeDialog] = useState(null) // { row, seasonNumber, episode, initial }

    const tmdbGet = useCallback(async (path, params = {}) => {
        const res = await instance.get(`${TMDB}${path}`, {
            params: { api_key: API_KEY, language: tmdbLanguage, ...params },
        })
        return res.data
    }, [tmdbLanguage])

    useEffect(() => {
        if (isGetFolders && isAuth) {
            instance.get('/folders')
                .then((res) => setFolders(res.data.results))
                .catch((err) => { console.warn(err); alertError(err) })
            setIsGetFolders(false)
        }
    }, [isGetFolders, isAuth])

    useEffect(() => {
        if (!isAuth) { setIsLoading(false); return }

        let cancelled = false
        setIsLoading(true)

        const load = async () => {
            const { data } = await instance.get('/updates')
            const { movies, tv } = data.results
            if (cancelled) return

            // tmdbId -> збережений документ (для редагування та іконки статусу)
            const savedByTmdbId = new Map(movies.map((m) => [m.tmdbId, m]))

            // --- ФІЛЬМИ: збираємо колекції ---
            // Затравка — лише watching/watched. Якщо з франшизи нічого не дивилися
            // (усе в planned) або її кинули (dropped), колекція не зʼявляється.
            const seeds = movies.filter((m) => SEED_STATUSES.has(m.status))

            const details = await mapLimit(seeds, CONCURRENCY, async (m) => {
                try { return await tmdbGet(`/movie/${m.tmdbId}`) } catch { return null }
            })
            if (cancelled) return

            // Колекції унікальні: кілька переглянутих частин дають один рядок
            const collectionIds = [...new Set(
                details.filter(Boolean).map((m) => m.belongs_to_collection?.id).filter(Boolean)
            )]

            const collections = await mapLimit(collectionIds, CONCURRENCY, async (id) => {
                try { return await tmdbGet(`/collection/${id}`) } catch { return null }
            })
            if (cancelled) return

            const collectionRows = collections.filter(Boolean).map((collection) => {
                const parts = [...(collection.parts || [])]
                    .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
                    .map((part) => {
                        const saved = savedByTmdbId.get(part.id)
                        return {
                            id: part.id,
                            title: part.title,
                            posterPath: part.poster_path,
                            releaseDate: part.release_date || '',
                            // null — не збережений; інакше статус папки
                            status: saved?.status || null,
                            mongoId: saved?.mongoId || null,
                            folderName: saved?.folderName || null,
                            // Дані збереженого документа — щоб редагування відкривалось заповненим
                            saved: saved || null,
                        }
                    })
                // Позаду лише переглянуте й кинуте. Те, що дивляться зараз (watching)
                // або заплановане (planned), лишається в лічильнику — просто з іншою іконкою.
                const unwatched = parts.filter((p) => !HANDLED_STATUSES.has(p.status))
                return {
                    key: `collection-${collection.id}`,
                    kind: 'collection',
                    id: collection.id,
                    title: cleanCollectionName(collection.name),
                    posterPath: collection.poster_path,
                    parts,
                    unwatchedCount: unwatched.length,
                    latestDate: unwatched.reduce((max, p) => (p.releaseDate > max ? p.releaseDate : max), ''),
                }
            }).filter((row) => row.unwatchedCount > 0)

            // --- СЕРІАЛИ ---
            const serials = await mapLimit(tv, CONCURRENCY, async (entry) => {
                try { return { entry, data: await tmdbGet(`/tv/${entry.tmdbId}`) } } catch { return null }
            })
            if (cancelled) return

            const tvRows = serials.filter(Boolean).map(({ entry, data }) => {
                const seasons = (data.seasons || [])
                    .filter((s) => s.season_number > 0 && s.episode_count > 0)
                    .map((s) => {
                        const watchedEpisodes = entry.watched[String(s.season_number)] || {}
                        // Сезон переглянутий, лише якщо переглянуті ВСІ серії
                        const unwatchedCount = Math.max(0, s.episode_count - Object.keys(watchedEpisodes).length)
                        return {
                            seasonNumber: s.season_number,
                            name: s.name,
                            posterPath: s.poster_path,
                            airDate: s.air_date || '',
                            episodeCount: s.episode_count,
                            watchedEpisodes,
                            unwatchedCount,
                        }
                    })
                const unwatchedCount = seasons.reduce((sum, s) => sum + s.unwatchedCount, 0)
                return {
                    key: `tv-${entry.tmdbId}`,
                    kind: 'tv',
                    id: entry.tmdbId,
                    mongoId: entry.mongoId,
                    folderName: entry.folderName,
                    copies: entry.copies,
                    customTypes: entry.customTypes || [],
                    title: data.name,
                    posterPath: data.poster_path,
                    seasons,
                    unwatchedCount,
                    latestDate: seasons
                        .filter((s) => s.unwatchedCount > 0)
                        .reduce((max, s) => (s.airDate > max ? s.airDate : max), ''),
                }
            }).filter((row) => row.unwatchedCount > 0)

            if (!cancelled) {
                setRows([...collectionRows, ...tvRows])
                setIsLoading(false)
            }
        }

        load().catch((err) => {
            if (cancelled) return
            console.warn(err)
            alertError(err, 'Failed to load updates')
            setIsLoading(false)
        })

        return () => { cancelled = true }
    }, [isAuth, tmdbGet])

    // Фільтри з шапки застосовуються до вже завантажених даних — без нових запитів
    const sortedRows = useMemo(() => {
        // Порожній список тегів = фільтра немає. NO_TAG — елементи без тегу.
        const matchesTag = (tag) => customTypes.length === 0
            || customTypes.includes(tag)
            || (customTypes.includes(NO_TAG) && !tag)

        const list = rows.filter((row) => {
            if (row.kind === 'collection') {
                if (!typeTMDB.includes('movie')) return false
                // Колекція підходить, якщо хоча б один збережений фільм має потрібний тег
                return row.parts.some((p) => p.status && matchesTag(p.saved?.customType))
            }
            if (!typeTMDB.includes('tv')) return false
            return (row.customTypes.length ? row.customTypes : ['']).some((tag) => matchesTag(tag))
        })

        if (sortBy === 'title') return list.sort((a, b) => a.title.localeCompare(b.title))
        if (sortBy === 'recent') return list.sort((a, b) => (b.latestDate || '').localeCompare(a.latestDate || ''))
        return list.sort((a, b) => b.unwatchedCount - a.unwatchedCount)
    }, [rows, sortBy, typeTMDB, customTypes])

    // --- ЛОКАЛЬНЕ ОНОВЛЕННЯ ---
    // Перезавантажувати весь список після кожної дії надто дорого: це десятки
    // запитів до TMDB і спінер на пів екрана. Тому правимо стан на місці.

    const patchMoviePart = useCallback((tmdbId, patch) => {
        setRows((prev) => prev.reduce((acc, row) => {
            if (row.kind !== 'collection' || !row.parts.some((p) => p.id === tmdbId)) {
                acc.push(row)
                return acc
            }
            const parts = row.parts.map((p) => (p.id === tmdbId ? { ...p, ...patch } : p))
            const unwatched = parts.filter((p) => !HANDLED_STATUSES.has(p.status))
            // Колекція без непереглянутих зникає зі списку
            if (unwatched.length === 0) return acc
            acc.push({
                ...row,
                parts,
                unwatchedCount: unwatched.length,
                latestDate: unwatched.reduce((max, p) => (p.releaseDate > max ? p.releaseDate : max), ''),
            })
            return acc
        }, []))
    }, [])

    // entries: { [номерСерії]: дані }. Одна серія — окремий випадок масового
    // позначення, тож обидва сценарії йдуть через один хелпер і один рендер.
    const patchEpisodes = useCallback((rowKey, seasonNumber, entries) => {
        setRows((prev) => prev.reduce((acc, row) => {
            if (row.key !== rowKey) { acc.push(row); return acc }
            const seasons = row.seasons.map((s) => {
                if (s.seasonNumber !== seasonNumber) return s
                const watchedEpisodes = { ...s.watchedEpisodes, ...entries }
                return {
                    ...s,
                    watchedEpisodes,
                    unwatchedCount: Math.max(0, s.episodeCount - Object.keys(watchedEpisodes).length),
                }
            })
            const unwatchedCount = seasons.reduce((sum, s) => sum + s.unwatchedCount, 0)
            // Серіал без нових серій зникає зі списку
            if (unwatchedCount === 0) return acc
            acc.push({
                ...row,
                seasons,
                unwatchedCount,
                latestDate: seasons
                    .filter((s) => s.unwatchedCount > 0)
                    .reduce((max, s) => (s.airDate > max ? s.airDate : max), ''),
            })
            return acc
        }, []))
    }, [])

    // --- ФІЛЬМ: плюсик (додати) і галочка (редагувати) ---
    const handleMoviePlus = useCallback((part) => {
        setMovieDialog({
            mode: 'add',
            item: { id: part.id, title: part.title, media_type: 'movie', tmdbType: 'movie' },
            // Папку користувач обирає сам — нічого не підставляємо наперед
            folder: false,
        })
    }, [])

    const handleMovieCheck = useCallback((part) => {
        setMovieDialog({
            mode: 'edit',
            item: {
                _id: part.mongoId,
                id: part.id,
                title: part.title,
                media_type: 'movie',
                tmdbType: 'movie',
                // Прокидаємо збережені значення, інакше форма відкриється порожньою
                rating: part.saved?.rating ?? null,
                comment: part.saved?.comment || '',
                dateAdded: part.saved?.dateAdded || null,
                customType: part.saved?.customType || null,
            },
            // Беремо повний обʼєкт папки зі списку: сайдбар підсвічує вибране
            // за order, тож самої назви замало
            folder: folders.find((f) => f.name === part.folderName) || false,
        })
    }, [folders])

    const handleMovieSaved = useCallback((updated) => {
        setMovieDialog((dialog) => {
            if (!dialog) return null
            patchMoviePart(dialog.item.id, {
                // Статус беремо з папки, яку обрали в діалозі: від нього залежить
                // і іконка, і чи вважати фільм опрацьованим
                status: dialog.folder?.status || null,
                mongoId: updated?._id || dialog.item._id || null,
                folderName: dialog.folder?.name || null,
                saved: {
                    rating: updated?.rating ?? null,
                    comment: updated?.comment || '',
                    dateAdded: updated?.dateAdded || null,
                    customType: updated?.customType || null,
                },
            })
            return null
        })
    }, [patchMoviePart])

    // --- СЕРІЯ: позначити переглянутою або відредагувати ---
    const handleEpisodeMark = useCallback(async (row, seasonNumber, episodeNumber) => {
        const data = { dateAdded: toDateOnlyISO(new Date()), watchedCount: 1, rating: null, comment: '' }
        try {
            await instance.patch(`/tv/${row.mongoId}/season/${seasonNumber}/episode/${episodeNumber}`, data)
            patchEpisodes(row.key, seasonNumber, { [String(episodeNumber)]: data })
        } catch (err) { console.warn(err); alertError(err) }
    }, [patchEpisodes])

    // Позначити переглянутими всі непереглянуті серії сезону одним запитом
    const handleSeasonMarkAll = useCallback(async (row, seasonNumber, episodeNumbers) => {
        if (!episodeNumbers.length) return
        const data = { dateAdded: toDateOnlyISO(new Date()), watchedCount: 1, rating: null, comment: '' }
        try {
            await instance.patch(`/tv/${row.mongoId}/season/${seasonNumber}/watched`, { episodes: episodeNumbers })
            patchEpisodes(
                row.key,
                seasonNumber,
                Object.fromEntries(episodeNumbers.map((n) => [String(n), data]))
            )
        } catch (err) { console.warn(err); alertError(err) }
    }, [patchEpisodes])

    const handleEpisodeEdit = useCallback((row, seasonNumber, episodeNumber, initial) => {
        setEpisodeDialog({ row, seasonNumber, episodeNumber, initial })
    }, [])

    const handleEpisodeSave = useCallback(async (values) => {
        if (!episodeDialog) return
        const { row, seasonNumber, episodeNumber } = episodeDialog
        try {
            await instance.patch(`/tv/${row.mongoId}/season/${seasonNumber}/episode/${episodeNumber}`, values)
            patchEpisodes(row.key, seasonNumber, {
                [String(episodeNumber)]: {
                    ...values,
                    dateAdded: values.dateAdded ? new Date(values.dateAdded).toISOString() : null,
                },
            })
            setEpisodeDialog(null)
        } catch (err) { console.warn(err); alertError(err) }
    }, [episodeDialog, patchEpisodes])

    if (!isAuth) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography variant="h6" color="text.secondary">
                    Please log in to see new releases
                </Typography>
            </Box>
        )
    }

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress color="primary" />
            </Box>
        )
    }

    const totalNew = sortedRows.reduce((sum, row) => sum + row.unwatchedCount, 0)

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            {/* Шапка */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="sectionTitle" color="text.main">
                        New releases
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {sortedRows.length === 0
                            ? 'Everything you are watching is up to date'
                            : `${totalNew} new in ${sortedRows.length} ${sortedRows.length === 1 ? 'title' : 'titles'}`}
                    </Typography>
                </Box>

                {sortedRows.length > 0 && (
                    <DropdownMenu
                        width={200}
                        items={SORT_OPTIONS.map((option) => ({
                            key: option.key,
                            label: option.label,
                            selected: sortBy === option.key,
                            endAdornment: sortBy === option.key ? <CheckIcon fontSize="small" /> : null,
                            onClick: () => setSortBy(option.key),
                        }))}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        renderTrigger={({ onClick }) => (
                            <Box
                                onClick={onClick}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    px: 2, height: 40, borderRadius: 2, cursor: 'pointer',
                                    border: '1px solid', borderColor: 'text.main', color: 'text.main',
                                    transition: 'background-color 0.15s, color 0.15s',
                                    '&:hover': { bgcolor: 'yellow.main', color: 'yellow.contrastText', borderColor: 'yellow.main' },
                                }}
                            >
                                <SortIcon fontSize="small" />
                                <Typography variant="body2" noWrap>
                                    {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
                                </Typography>
                            </Box>
                        )}
                    />
                )}
            </Box>

            {/* Список */}
            {sortedRows.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                        Nothing new. Add movies or shows to a folder with the
                        <br />
                        "Watching" or "Watched" status and come back later.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {sortedRows.map((row) => (
                        <UpdateRow
                            key={row.key}
                            row={row}
                            onMoviePlus={handleMoviePlus}
                            onMovieCheck={handleMovieCheck}
                            onEpisodeMark={(seasonNumber, episodeNumber) => handleEpisodeMark(row, seasonNumber, episodeNumber)}
                            onSeasonMarkAll={(seasonNumber, episodeNumbers) => handleSeasonMarkAll(row, seasonNumber, episodeNumbers)}
                            onEpisodeEdit={(seasonNumber, episodeNumber, initial) => handleEpisodeEdit(row, seasonNumber, episodeNumber, initial)}
                        />
                    ))}
                </Box>
            )}

            {/* Діалог фільму — той самий, що на сторінці фільму й у списках */}
            <ItemSaveDialog
                isOpenDialogAdd={movieDialog?.mode === 'add'}
                isOpenDialogEdit={movieDialog?.mode === 'edit'}
                handleCloseDialog={() => setMovieDialog(null)}
                selectedFolder={movieDialog?.folder ?? false}
                setSelectedFolder={(folder) => setMovieDialog((prev) => (prev ? { ...prev, folder } : prev))}
                selectedItem={movieDialog?.item ?? {}}
                onSaved={handleMovieSaved}
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />

            {/* Діалог серії — той самий, що на сторінці серіалу */}
            <SeasonEpisodeDialog
                open={Boolean(episodeDialog)}
                mode="episode"
                title={episodeDialog ? `S${episodeDialog.seasonNumber} · E${episodeDialog.episodeNumber}` : ''}
                initial={episodeDialog?.initial || {}}
                onClose={() => setEpisodeDialog(null)}
                onSave={handleEpisodeSave}
            />
        </Box>
    )
}

export default UpdatesPage
