import { Box, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsAuth, updateUserData } from '../../redux/slices/AuthSlice'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import instance from '../../axios'
import { alertError } from '../../alerts'
import { getTmdbLanguage } from '../../utils/languages'
import { cacheGet, cacheSet, isFresh } from '../../utils/tmdbCache'
import { toDateOnlyISO } from '../../utils/dates'
import { FOLDER_STATUSES, getBestStatus } from '../../utils/folderStatus'
import { fetchSavedDoc } from '../../utils/savedItems'
import { getTags } from '../../utils/tags'
import { NO_TAG, setViewMode } from '../../redux/slices/ConfigSlice'
import Sort from '../../components/Sorting/Sort'
import SegmentedSwitch, { SLIDE_MS } from '../../components/SegmentedSwitch'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import SeasonEpisodeDialog from '../../components/SeasonEpisodeDialog/SeasonEpisodeDialog'
import MarkWatchedDialog from '../../components/MarkWatchedDialog/MarkWatchedDialog'
import UpdateRow from './UpdateRow'
import {
    SEED_STATUSES, VIEWS, isCollectionVisible, getMute, todayIso,
    slimTv, slimCollection, buildTvRow, mergeTvRow, buildCollectionRow, mergeCollectionRow, collectionTotals,
} from './buildRows'
import { tmdbGet as tmdbRequest } from '../../utils/tmdbApi'
import CenteredState from '../../components/CenteredState'


// TMDB has no batch endpoint, so every movie/series is its own request; concurrency is capped to stay under
// the rate limit.
const CONCURRENCY = 10

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

// order = default direction: desc gives the same order as before (most new / latest releases first), Title
// ascending (A-Z).
const SORT_OPTIONS = {
    'Recently watched': { order: 'desc' },
    'New episodes': { order: 'desc' },
    'Release date': { order: 'desc' },
    'Title': { order: 'asc' },
}

// Comparators always ascend; the direction flips below.
const SORT_COMPARATORS = {
    'Recently watched': (a, b) => (a.lastActivity || 0) - (b.lastActivity || 0),
    'New episodes': (a, b) => a.unwatchedCount - b.unwatchedCount,
    'Release date': (a, b) => (a.latestDate || '').localeCompare(b.latestDate || ''),
    'Title': (a, b) => a.title.localeCompare(b.title),
}

function UpdatesPage() {
    const dispatch = useDispatch()
    const isAuth = useSelector(selectIsAuth)
    const { language, typeTMDB, customTypes, viewMode } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)
    // Where each copy lives (saved index): needed to compute a part's status after an edit
    const savedIndex = useSelector((state) => state.saved.byKey)
    // Franchises the user stopped following. A ref, so the load effect reads the current list without re-running when
    // it changes.
    const mutedCollections = useSelector((state) => state.auth.data?.mutedCollections) || []
    const mutedRef = useRef(mutedCollections)
    mutedRef.current = mutedCollections

    // switchView is what the switch shows (instant); view is the mode the data is loaded for, trailing by the animation
    // time so the reload doesn't stall the slide.
    const [switchView, setSwitchView] = useState(VIEWS.ACTIVE)
    const [view, setView] = useState(VIEWS.ACTIVE)
    useEffect(() => {
        const timer = setTimeout(() => setView(switchView), SLIDE_MS)
        return () => clearTimeout(timer)
    }, [switchView])
    const [isLoading, setIsLoading] = useState(true)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
    const [rows, setRows] = useState([])
    const [nameSortBy, setNameSortBy] = useState('Recently watched')
    const [sortDirection, setSortDirection] = useState(SORT_OPTIONS['Recently watched'].order)

    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    const [movieDialog, setMovieDialog] = useState(null) // { mode, item, folder }
    const [episodeDialog, setEpisodeDialog] = useState(null) // { row, seasonNumber, episode, initial }

    const tmdbGet = useCallback((path, params = {}) => tmdbRequest(path, { language: tmdbLanguage, ...params }), [tmdbLanguage])

    useEffect(() => {
        if (isGetFolders && isAuth) {
            instance.get('/folders')
                .then((res) => setFolders(res.data.results))
                .catch((err) => { console.warn(err); alertError(err) })
            setIsGetFolders(false)
        }
    }, [isGetFolders, isAuth])

    const [refresh, setRefresh] = useState(null)

    useEffect(() => {
        if (!isAuth) { setIsLoading(false); return }

        let cancelled = false
        let flushTimer = null
        setIsLoading(true)
        setRefresh(null)

        const load = async () => {
            // 1) User-saved data (watched, folders, ratings) always comes fresh from the backend and is never
            // cached.
            const { data } = await instance.get('/updates', { params: { view: view === VIEWS.DROPPED ? VIEWS.DROPPED : VIEWS.ACTIVE } })
            const { movies, tv } = data.results
            if (cancelled) return

            const savedByTmdbId = new Map(movies.map((m) => [m.tmdbId, m]))

            // Seed: only watching/watched. A franchise with nothing watched (all planned or dropped) doesn't appear. The
            // Dropped view is series only.
            const seeds = view === VIEWS.DROPPED ? [] : movies.filter((m) => SEED_STATUSES.has(m.status))

            // 2) TMDB metadata: draw from the cache at once (even stale), refresh missing/expired entries in
            // the background.
            // The Muted view lists franchises even when nothing is new (that's where they are un-muted), and no series.
            const isShown = (row) => row.kind === 'collection'
                ? isCollectionVisible(view, row, mutedRef.current) && (view === VIEWS.MUTED || row.unwatchedCount > 0)
                : view !== VIEWS.MUTED && row.unwatchedCount > 0
            const rowsByKey = new Map()
            const tasks = []
            const scheduledCollections = new Set() // one collection can serve several watched parts

            for (const entry of (view === VIEWS.MUTED ? [] : tv)) {
                const cached = cacheGet('tv', tmdbLanguage, entry.tmdbId)
                if (cached) {
                    const row = buildTvRow(entry, cached.d)
                    if (isShown(row)) rowsByKey.set(row.key, row)
                }
                if (!isFresh('tv', cached)) tasks.push({ type: 'tv', entry })
            }

            for (const seed of seeds) {
                // A movie's collection doesn't depend on language: key "all"
                const movieMeta = cacheGet('movie', 'all', seed.tmdbId)
                if (!movieMeta || !isFresh('movie', movieMeta)) tasks.push({ type: 'seed', seed })
                const collectionId = movieMeta?.d.collectionId
                if (!collectionId || scheduledCollections.has(collectionId)) continue
                scheduledCollections.add(collectionId)
                const cachedCollection = cacheGet('collection', tmdbLanguage, collectionId)
                if (cachedCollection) {
                    const row = buildCollectionRow(cachedCollection.d, savedByTmdbId)
                    if (isShown(row)) rowsByKey.set(row.key, row)
                }
                if (!isFresh('collection', cachedCollection)) tasks.push({ type: 'collection', id: collectionId })
            }

            const hadCache = rowsByKey.size > 0
            setRows([...rowsByKey.values()])
            setLoadVersion((v) => v + 1)
            setHasLoadedOnce(true)
            setIsLoading(false)
            if (!tasks.length) return

            // 3) Background refresh: rows are batched into state, existing ones update in place (order untouched), new
            // ones go last.
            const total = tasks.length
            let done = 0
            const fresh = []
            const flush = () => {
                flushTimer = null
                if (cancelled) return
                setRefresh(done >= total ? null : { done, total })
                if (!fresh.length) return
                const batch = fresh.splice(0)
                setRows((prev) => {
                    const next = [...prev]
                    for (const row of batch) {
                        const at = next.findIndex((r) => r.key === row.key)
                        if (at >= 0) next[at] = row.kind === 'tv' ? mergeTvRow(next[at], row) : mergeCollectionRow(next[at], row)
                        else if (isShown(row)) next.push(row)
                    }
                    return next
                })
                // First visit without a cache: rows arrive one by one, so sort each batch. With a cache the
                // order is left alone, otherwise the list would jump just because the refresh finished.
                if (!hadCache) setLoadVersion((v) => v + 1)
            }
            const emit = (row) => {
                fresh.push(row)
                if (!flushTimer) flushTimer = setTimeout(flush, 300)
            }
            setRefresh({ done: 0, total })

            const fetchCollection = async (id) => {
                const meta = slimCollection(await tmdbGet(`/collection/${id}`))
                cacheSet('collection', tmdbLanguage, id, meta)
                emit(buildCollectionRow(meta, savedByTmdbId))
            }

            await mapLimit(tasks, CONCURRENCY, async (task) => {
                try {
                    if (task.type === 'tv') {
                        const meta = slimTv(await tmdbGet(`/tv/${task.entry.tmdbId}`))
                        cacheSet('tv', tmdbLanguage, task.entry.tmdbId, meta)
                        emit(buildTvRow(task.entry, meta))
                    } else if (task.type === 'seed') {
                        const details = await tmdbGet(`/movie/${task.seed.tmdbId}`)
                        const collectionId = details.belongs_to_collection?.id || null
                        cacheSet('movie', 'all', task.seed.tmdbId, { collectionId })
                        if (collectionId && !scheduledCollections.has(collectionId)) {
                            scheduledCollections.add(collectionId)
                            await fetchCollection(collectionId)
                        }
                    } else {
                        await fetchCollection(task.id)
                    }
                } catch (err) {
                    // Keep what's in the cache: one failed request mustn't break the page
                    console.warn(err)
                } finally {
                    done += 1
                }
            })
            if (cancelled) return
            clearTimeout(flushTimer)
            flush()
        }

        load().catch((err) => {
            if (cancelled) return
            console.warn(err)
            alertError(err, 'Failed to load updates')
            setIsLoading(false)
        })

        return () => {
            cancelled = true
            clearTimeout(flushTimer)
        }
    }, [isAuth, tmdbGet, view, tmdbLanguage])

    // Row order is fixed only on load or when the user changes sort/filter; local edits leave it alone so a row doesn't
    // jump.
    const rowsRef = useRef(rows)
    rowsRef.current = rows
    const [loadVersion, setLoadVersion] = useState(0)
    const sortOrder = useMemo(() => {
        const compare = SORT_COMPARATORS[nameSortBy] || SORT_COMPARATORS['Recently watched']
        const keys = [...rowsRef.current]
            .sort((a, b) => sortDirection === 'asc' ? compare(a, b) : -compare(a, b))
            .map((row) => row.key)
        return new Map(keys.map((key, index) => [key, index]))
        // typeTMDB / customTypes count as a "filter click" too: they don't affect the order, but they re-sort
        // the list
    }, [loadVersion, nameSortBy, sortDirection, typeTMDB, customTypes]) // eslint-disable-line react-hooks/exhaustive-deps

    const sortedRows = useMemo(() => {
        // Empty tag list = no filter. NO_TAG = items without a tag.
        const matchesTag = (tag) => customTypes.length === 0
            || customTypes.includes(tag)
            || (customTypes.includes(NO_TAG) && !tag)

        const list = rows.filter((row) => {
            if (row.kind === 'collection') {
                if (!typeTMDB.includes('movie')) return false
                // A collection matches if any saved movie has the tag; a movie can have several tags, one
                // match is enough; no tags counts as "no tag".
                return row.parts.some((p) => {
                    if (!p.status) return false
                    const tags = getTags(p.saved?.customType)
                    return (tags.length ? tags : ['']).some((tag) => matchesTag(tag))
                })
            }
            if (!typeTMDB.includes('tv')) return false
            return (row.customTypes.length ? row.customTypes : ['']).some((tag) => matchesTag(tag))
        })

        const position = (row) => sortOrder.get(row.key) ?? Number.MAX_SAFE_INTEGER
        return list.sort((a, b) => position(a) - position(b))
    }, [rows, sortOrder, typeTMDB, customTypes])

    // Reloading the whole list after every action is too expensive (dozens of TMDB requests, a spinner over
    // half the screen), so state is patched in place.

    // A row isn't removed immediately even with nothing new left: abrupt disappearance is confusing. It stays with
    // counter 0 until the next load.
    const patchMoviePart = useCallback((tmdbId, patch) => {
        setRows((prev) => prev.map((row) => {
            if (row.kind !== 'collection' || !row.parts.some((p) => p.id === tmdbId)) return row
            const parts = row.parts.map((p) => (
                p.id === tmdbId ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p
            ))
            const { unwatchedCount, releasedCount, latestDate } = collectionTotals(parts)
            return {
                ...row,
                parts,
                releasedCount,
                // Any edit counts as fresh activity: on the next sort click the row moves to the top
                lastActivity: Date.now(),
                unwatchedCount,
                latestDate,
            }
        }))
    }, [])

    // entries: { [episodeNumber]: data }; one episode is a special case of bulk marking. removed = episode numbers
    // (strings) taken out of the DB.
    const patchEpisodes = useCallback((rowKey, seasonNumber, entries, removed = []) => {
        setRows((prev) => prev.map((row) => {
            if (row.key !== rowKey) return row
            const seasons = row.seasons.map((s) => {
                if (s.seasonNumber !== seasonNumber) return s
                const watchedEpisodes = { ...s.watchedEpisodes, ...entries }
                removed.forEach((key) => { delete watchedEpisodes[key] })
                return {
                    ...s,
                    watchedEpisodes,
                    unwatchedCount: Math.max(0, s.episodeCount - Object.keys(watchedEpisodes).length),
                }
            })
            const unwatchedCount = seasons.reduce((sum, s) => sum + s.unwatchedCount, 0)
            return {
                ...row,
                seasons,
                lastActivity: Date.now(),
                unwatchedCount,
                latestDate: seasons
                    .filter((s) => s.unwatchedCount > 0)
                    .reduce((max, s) => (s.airDate > max ? s.airDate : max), ''),
            }
        }))
    }, [])

    // Stop following a franchise (mode: 'forever' | 'new-part') or follow it again. The row leaves the list at once:
    // it's an explicit action, unlike an edit.
    const applyMuted = useCallback((mutedList, row) => {
        dispatch(updateUserData({ mutedCollections: mutedList }))
        setRows((prev) => prev.filter((r) => r.key !== row.key))
    }, [dispatch])

    const handleMute = useCallback(async (row, mode) => {
        try {
            const { data } = await instance.put(`/auth/muted-collections/${row.id}`, { mode, mutedAt: todayIso() })
            applyMuted(data.results, row)
        } catch (err) { console.warn(err); alertError(err) }
    }, [applyMuted])

    const handleUnmute = useCallback(async (row) => {
        try {
            const { data } = await instance.delete(`/auth/muted-collections/${row.id}`)
            applyMuted(data.results, row)
        } catch (err) { console.warn(err); alertError(err) }
    }, [applyMuted])

    const handleMoviePlus = useCallback((part) => {
        setMovieDialog({
            mode: 'add',
            item: { id: part.id, title: part.title, media_type: 'movie', tmdbType: 'movie' },
            folder: false,
        })
    }, [])

    const handleMovieCheck = useCallback(async (part, copy) => {
        try {
            // Full copy data: without it the form would open empty and saving would wipe the rating and
            // comment.
            const doc = await fetchSavedDoc('movie', copy.mongoId)
            setMovieDialog({
                mode: 'edit',
                item: {
                    _id: copy.mongoId,
                    id: part.id,
                    title: part.title,
                    media_type: 'movie',
                    tmdbType: 'movie',
                    rating: doc.rating ?? null,
                    comment: doc.comment || '',
                    dateAdded: doc.dateAdded || null,
                    customType: getTags(doc.customType),
                },
                // Take the full folder object from the list: the sidebar highlights by order, so the name
                // alone isn't enough.
                folder: folders.find((f) => f.name === copy.folderName) || false,
            })
        } catch (err) {
            console.warn(err)
            alertError(err)
        }
    }, [folders])

    const handleMovieSaved = useCallback((updated) => {
        setMovieDialog((dialog) => {
            if (!dialog) return null
            // There may be several copies: the part's status is the strongest among them; the edited copy is
            // now in the chosen folder, the rest stay as they were.
            const editedId = updated?._id || dialog.item._id
            const others = (savedIndex[`movie:${dialog.item.id}`] || []).filter((c) => c.mongoId !== editedId)
            patchMoviePart(dialog.item.id, () => ({
                status: getBestStatus([...others.map((c) => c.status), dialog.folder?.status || null]),
                mongoId: editedId || null,
                folderName: dialog.folder?.name || null,
                saved: {
                    rating: updated?.rating ?? null,
                    comment: updated?.comment || '',
                    dateAdded: updated?.dateAdded || null,
                    customType: getTags(updated?.customType),
                },
            }))
            return null
        })
    }, [patchMoviePart, savedIndex])

    // Deleted from the edit dialog: the part stays in the "new" list, status from the remaining copies.
    const handleMovieDeleted = useCallback(() => {
        if (!movieDialog) return
        const others = (savedIndex[`movie:${movieDialog.item.id}`] || []).filter((c) => c.mongoId !== movieDialog.item._id)
        patchMoviePart(movieDialog.item.id, () => ({
            status: getBestStatus(others.map((c) => c.status)),
            mongoId: others[0]?.mongoId || null,
            folderName: others[0]?.folderName || null,
            saved: null,
        }))
    }, [movieDialog, savedIndex, patchMoviePart])

    const handleEpisodeMark = useCallback(async (row, seasonNumber, episodeNumber) => {
        const data = { dateAdded: toDateOnlyISO(new Date()), watchedCount: 1, rating: null, comment: '' }
        try {
            await instance.patch(`/tv/${row.mongoId}/season/${seasonNumber}/episode/${episodeNumber}`, data)
            patchEpisodes(row.key, seasonNumber, { [String(episodeNumber)]: data })
        } catch (err) { console.warn(err); alertError(err) }
    }, [patchEpisodes])

    // Mark all unwatched episodes of a season in one request. Bulk and only reversible per episode, so a dialog asks
    // for the watch date first.
    // State: { row, seasonNumber, episodeNumbers }.
    const [markDialog, setMarkDialog] = useState(null)
    const handleSeasonMarkAll = useCallback((row, seasonNumber, episodeNumbers) => {
        if (!episodeNumbers.length) return
        setMarkDialog({ row, seasonNumber, episodeNumbers })
    }, [])

    const handleConfirmMarkAll = useCallback(async (dateAdded) => {
        if (!markDialog) return
        const { row, seasonNumber, episodeNumbers } = markDialog
        setMarkDialog(null)
        const data = { dateAdded, watchedCount: 1, rating: null, comment: '' }
        try {
            await instance.patch(`/tv/${row.mongoId}/season/${seasonNumber}/watched`, { episodes: episodeNumbers, dateAdded })
            patchEpisodes(
                row.key,
                seasonNumber,
                Object.fromEntries(episodeNumbers.map((n) => [String(n), data]))
            )
        } catch (err) { console.warn(err); alertError(err) }
    }, [markDialog, patchEpisodes])

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

    const handleEpisodeDelete = useCallback(async () => {
        if (!episodeDialog) return
        const { row, seasonNumber, episodeNumber } = episodeDialog
        try {
            await instance.delete(`/tv/${row.mongoId}/season/${seasonNumber}/episode/${episodeNumber}`)
            patchEpisodes(row.key, seasonNumber, {}, [String(episodeNumber)])
            setEpisodeDialog(null)
        } catch (err) { console.warn(err); alertError(err) }
    }, [episodeDialog, patchEpisodes])

    if (!isAuth) {
        return (
            <CenteredState minHeight={300}>Please log in to see new releases</CenteredState>
        )
    }

    // Spinner only on the first load. When switching mode the header (with the switch) stays, otherwise the
    // thumb wouldn't finish sliding: the component would vanish.
    if (isLoading && rows.length === 0 && !hasLoadedOnce) {
        return (
            <CenteredState minHeight={400} loading />
        )
    }

    const totalNew = sortedRows.reduce((sum, row) => sum + row.unwatchedCount, 0)
    const titlesWithNew = sortedRows.filter((row) => row.unwatchedCount > 0).length
    // Still waiting: the backend response is loading, or an empty list is being filled from TMDB (first visit
    // without a cache); otherwise "all watched" would flash.
    const isWaiting = isLoading || (refresh !== null && sortedRows.length === 0)
    const isDroppedView = view === VIEWS.DROPPED
    const isMutedView = view === VIEWS.MUTED

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            {/* Three columns: title | switch centered | sort. Side columns are equal (1fr), so the switch is always centered whatever the summary says. */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
                alignItems: 'center',
                justifyItems: { xs: 'stretch', md: 'start' },
                gap: 2,
            }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="sectionTitle" color="text.main">
                        {isDroppedView ? 'Dropped' : isMutedView ? 'Muted franchises' : 'New releases'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {isWaiting
                            ? 'Loading…'
                            : sortedRows.length === 0
                            ? (isDroppedView ? 'No dropped series with new episodes' : isMutedView ? 'No muted franchises' : 'Everything you are watching is up to date')
                            : isMutedView
                            ? `${sortedRows.length} ${sortedRows.length === 1 ? 'franchise' : 'franchises'}${refresh ? ' · updating…' : ''}`
                            : `${totalNew} new in ${titlesWithNew} ${titlesWithNew === 1 ? 'title' : 'titles'}${refresh ? ' · updating…' : ''}`}
                    </Typography>
                </Box>

                <SegmentedSwitch
                    value={switchView}
                    onChange={setSwitchView}
                    sx={{ justifySelf: 'center' }}
                    options={[
                        { value: VIEWS.ACTIVE, label: 'New' },
                        { value: VIEWS.DROPPED, label: 'Dropped' },
                        { value: VIEWS.MUTED, label: 'Muted' },
                    ]}
                />

                {/* Sort stays in the layout (just invisible) so the switch doesn't jump when it disappears during loading or on an empty list. */}
                <Box sx={{
                    justifySelf: { xs: 'stretch', md: 'end' },
                    display: 'flex', alignItems: 'center', gap: 2,
                    visibility: !isLoading && sortedRows.length > 0 ? 'visible' : 'hidden',
                }}>
                    <Box sx={{ flexGrow: { xs: 1, md: 0 }, minWidth: 0 }}>
                        <Sort
                            nameSortBy={nameSortBy}
                            setNameSortBy={setNameSortBy}
                            sortDirection={sortDirection}
                            setSortDirection={setSortDirection}
                            categoriesSortBy={SORT_OPTIONS}
                        />
                    </Box>

                    <SegmentedSwitch
                        compact
                        value={viewMode}
                        onChange={(mode) => dispatch(setViewMode(mode))}
                        options={[
                            { value: 'cards', label: <GridViewIcon fontSize="small" />, ariaLabel: 'Show as cards' },
                            { value: 'list', label: <ViewListIcon fontSize="small" />, ariaLabel: 'Show as list' },
                        ]}
                    />
                </Box>
            </Box>

            {isWaiting ? (
                <CenteredState minHeight={200} loading />
            ) : sortedRows.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                        {isDroppedView ? (
                            <>
                                Nothing here. Series from folders with the "Dropped" status that have new episodes will appear here.
                            </>
                        ) : isMutedView ? (
                            <>
                                Nothing here. Movie franchises you stop following will appear here, so you can follow them again.
                            </>
                        ) : (
                            <>
                                Nothing new. Add movies or shows to a folder with the "Watching" or "Watched" status and come back later.
                            </>
                        )}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {sortedRows.map((row) => (
                        <UpdateRow
                            key={row.key}
                            row={row}
                            mutedMode={row.kind === 'collection' ? getMute(mutedCollections, row.id)?.mode ?? null : null}
                            onMute={handleMute}
                            onUnmute={handleUnmute}
                            onMoviePlus={handleMoviePlus}
                            onMovieCheck={handleMovieCheck}
                            onEpisodeMark={(seasonNumber, episodeNumber) => handleEpisodeMark(row, seasonNumber, episodeNumber)}
                            onSeasonMarkAll={(seasonNumber, episodeNumbers) => handleSeasonMarkAll(row, seasonNumber, episodeNumbers)}
                            onEpisodeEdit={(seasonNumber, episodeNumber, initial) => handleEpisodeEdit(row, seasonNumber, episodeNumber, initial)}
                        />
                    ))}
                </Box>
            )}

            <ItemSaveDialog
                isOpenDialogAdd={movieDialog?.mode === 'add'}
                isOpenDialogEdit={movieDialog?.mode === 'edit'}
                handleCloseDialog={() => setMovieDialog(null)}
                selectedFolder={movieDialog?.folder ?? false}
                setSelectedFolder={(folder) => setMovieDialog((prev) => (prev ? { ...prev, folder } : prev))}
                selectedItem={movieDialog?.item ?? {}}
                onSaved={handleMovieSaved}
                onAfterDelete={handleMovieDeleted}
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />

            <MarkWatchedDialog
                open={Boolean(markDialog)}
                title={markDialog ? `${markDialog.row.title} · Season ${markDialog.seasonNumber}` : ''}
                description={markDialog
                    ? `Mark ${markDialog.episodeNumbers.length} remaining ${markDialog.episodeNumbers.length === 1 ? 'episode' : 'episodes'} as watched. Choose the date they were watched.`
                    : ''}
                onClose={() => setMarkDialog(null)}
                onConfirm={handleConfirmMarkAll}
            />

            <SeasonEpisodeDialog
                open={Boolean(episodeDialog)}
                mode="episode"
                title={episodeDialog ? `S${episodeDialog.seasonNumber} · E${episodeDialog.episodeNumber}` : ''}
                initial={episodeDialog?.initial || {}}
                onClose={() => setEpisodeDialog(null)}
                onSave={handleEpisodeSave}
                onDelete={handleEpisodeDelete}
            />
        </Box>
    )
}

export default UpdatesPage
