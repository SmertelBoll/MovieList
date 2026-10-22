import { Box, CircularProgress, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
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
// SLIDE_MS — тривалість анімації повзунка; дані перезавантажуємо вже після неї
import SegmentedSwitch, { SLIDE_MS } from '../../components/SegmentedSwitch'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import SeasonEpisodeDialog from '../../components/SeasonEpisodeDialog/SeasonEpisodeDialog'
import MarkWatchedDialog from '../../components/MarkWatchedDialog/MarkWatchedDialog'
import UpdateRow from './UpdateRow'
import {
    HANDLED_STATUSES, SEED_STATUSES, VIEWS, isCollectionVisible,
    slimTv, slimCollection, buildTvRow, mergeTvRow, buildCollectionRow, mergeCollectionRow,
} from './buildRows'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const TMDB = process.env.REACT_APP_URL_TMDB

// TMDB не має пакетного ендпоінта, тож на кожен фільм/серіал іде свій запит.
// Обмежуємо паралельність, щоб не впертися в ліміт і не забити мережу.
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

// order — напрямок за замовчуванням: desc дає той самий порядок, що й раніше
// (спершу найбільше нового / найсвіжіші релізи), Title — за зростанням (A–Z).
const SORT_OPTIONS = {
    'New episodes': { order: 'desc' },
    'Release date': { order: 'desc' },
    'Title': { order: 'asc' },
}

// Компаратори завжди за зростанням — напрямок перевертає сортування нижче
const SORT_COMPARATORS = {
    'New episodes': (a, b) => a.unwatchedCount - b.unwatchedCount,
    'Release date': (a, b) => (a.latestDate || '').localeCompare(b.latestDate || ''),
    'Title': (a, b) => a.title.localeCompare(b.title),
}

function UpdatesPage() {
    const dispatch = useDispatch()
    const isAuth = useSelector(selectIsAuth)
    const { language, typeTMDB, customTypes, viewMode } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)
    // Де лежить кожна копія (індекс збережених): потрібен, щоб після правки порахувати статус частини
    const savedIndex = useSelector((state) => state.saved.byKey)

    // switchView — що показує перемикач (міняється миттєво, повзунок їде одразу).
    // view — режим, за яким завантажено й показано дані: наздоганяє перемикач із затримкою
    // на час анімації, щоб важке перезавантаження списку не гальмувало слайд.
    const [switchView, setSwitchView] = useState(VIEWS.ACTIVE)
    const [view, setView] = useState(VIEWS.ACTIVE)
    useEffect(() => {
        const timer = setTimeout(() => setView(switchView), SLIDE_MS)
        return () => clearTimeout(timer)
    }, [switchView])
    const [isLoading, setIsLoading] = useState(true)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
    const [rows, setRows] = useState([])
    const [nameSortBy, setNameSortBy] = useState('New episodes')
    const [sortDirection, setSortDirection] = useState(SORT_OPTIONS['New episodes'].order)

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

    // Фонове оновлення даних TMDB: { done, total } поки йде, інакше null
    const [refresh, setRefresh] = useState(null)

    useEffect(() => {
        if (!isAuth) { setIsLoading(false); return }

        let cancelled = false
        let flushTimer = null
        setIsLoading(true)
        setRefresh(null)

        const load = async () => {
            // 1) Збережене користувачем (що позначено, папки, оцінки) беремо з бекенда щоразу — воно ніколи не кешується.
            const { data } = await instance.get('/updates', { params: { view } })
            const { movies, tv } = data.results
            if (cancelled) return

            // tmdbId -> збережений документ (для редагування та іконки статусу)
            const savedByTmdbId = new Map(movies.map((m) => [m.tmdbId, m]))

            // Затравка — лише watching/watched. Якщо з франшизи нічого не дивилися (усе в planned) або її кинули (dropped),
            // колекція не зʼявляється. У режимі dropped затравка — фільм, що лежить у кинутій папці
            const seeds = movies.filter((m) => (view === VIEWS.DROPPED ? m.hasDropped : SEED_STATUSES.has(m.status)))

            // 2) Метадані TMDB: що є в кеші (хай і застаріле) — малюємо одразу, решту (немає / прострочено) оновимо у фоні.
            const isShown = (row) => row.unwatchedCount > 0 && (row.kind !== 'collection' || isCollectionVisible(view, row.parts))
            const rowsByKey = new Map()
            const tasks = []
            const scheduledCollections = new Set() // колекція одна на кілька переглянутих частин

            for (const entry of tv) {
                const cached = cacheGet('tv', tmdbLanguage, entry.tmdbId)
                if (cached) {
                    const row = buildTvRow(entry, cached.d)
                    if (isShown(row)) rowsByKey.set(row.key, row)
                }
                if (!isFresh('tv', cached)) tasks.push({ type: 'tv', entry })
            }

            for (const seed of seeds) {
                // До якої колекції належить фільм від мови не залежить — ключ «all»
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

            // Перший показ: список зʼявляється одразу, а не після всіх запитів до TMDB
            const hadCache = rowsByKey.size > 0
            setRows([...rowsByKey.values()])
            setLoadVersion((v) => v + 1)
            setHasLoadedOnce(true)
            setIsLoading(false)
            if (!tasks.length) return

            // 3) Фонове оновлення. Свіжі рядки накопичуються й зливаються в стан порціями, щоб не перемальовувати сторінку
            // після кожного запиту. Наявні рядки оновлюються на місці (порядок не чіпаємо), нові йдуть у кінець.
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
                // Перший візит без кешу: рядки приходять по одному, тож впорядковуємо кожну порцію.
                // З кешем порядок не чіпаємо — інакше список стрибав би просто від завершення оновлення.
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
                    // Лишаємо те, що є в кеші: збій одного запиту не повинен ламати сторінку
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

    // Порядок рядків фіксується лише тоді, коли список завантажено або користувач змінив сортування чи фільтр.
    // Локальні правки (позначили серію — лічильник змінився) порядок не чіпають: інакше рядок «стрибав» би
    // по сторінці просто від того, що в ньому стало менше нового.
    const rowsRef = useRef(rows)
    rowsRef.current = rows
    const [loadVersion, setLoadVersion] = useState(0)
    const sortOrder = useMemo(() => {
        const compare = SORT_COMPARATORS[nameSortBy] || SORT_COMPARATORS['New episodes']
        const keys = [...rowsRef.current]
            .sort((a, b) => sortDirection === 'asc' ? compare(a, b) : -compare(a, b))
            .map((row) => row.key)
        return new Map(keys.map((key, index) => [key, index]))
        // typeTMDB / customTypes — теж «клік по фільтру»: вони не впливають на порядок, але тоді список упорядковується заново
    }, [loadVersion, nameSortBy, sortDirection, typeTMDB, customTypes]) // eslint-disable-line react-hooks/exhaustive-deps

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
                // У фільму може бути кілька тегів: достатньо збігу хоча б одного; без тегів — як «без тегу»
                return row.parts.some((p) => {
                    if (!p.status) return false
                    const tags = getTags(p.saved?.customType)
                    return (tags.length ? tags : ['']).some((tag) => matchesTag(tag))
                })
            }
            if (!typeTMDB.includes('tv')) return false
            return (row.customTypes.length ? row.customTypes : ['']).some((tag) => matchesTag(tag))
        })

        // Порядок — зі збереженого sortOrder; рядки, яких там ще немає, йдуть в кінець
        const position = (row) => sortOrder.get(row.key) ?? Number.MAX_SAFE_INTEGER
        return list.sort((a, b) => position(a) - position(b))
    }, [rows, sortOrder, typeTMDB, customTypes])

    // --- ЛОКАЛЬНЕ ОНОВЛЕННЯ ---
    // Перезавантажувати весь список після кожної дії надто дорого: це десятки
    // запитів до TMDB і спінер на пів екрана. Тому правимо стан на місці.

    // Рядок не прибираємо зі списку одразу, навіть якщо в ньому не лишилось нового (остання частина переглянута або
    // колекція вже не підходить режиму): різке зникнення збиває з пантелику. З лічильником 0 він лишається,
    // а при наступному відкритті сторінки список збирається заново за звичайними правилами й рядка вже не буде.
    const patchMoviePart = useCallback((tmdbId, patch) => {
        setRows((prev) => prev.map((row) => {
            if (row.kind !== 'collection' || !row.parts.some((p) => p.id === tmdbId)) return row
            // patch — обʼєкт або функція від поточної частини (коли нове значення залежить від старого)
            const parts = row.parts.map((p) => (
                p.id === tmdbId ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p
            ))
            const unwatched = parts.filter((p) => !HANDLED_STATUSES.has(p.status))
            return {
                ...row,
                parts,
                unwatchedCount: unwatched.length,
                latestDate: unwatched.reduce((max, p) => (p.releaseDate > max ? p.releaseDate : max), ''),
            }
        }))
    }, [])

    // entries: { [номерСерії]: дані }. Одна серія — окремий випадок масового
    // позначення, тож обидва сценарії йдуть через один хелпер і один рендер.
    // removed — номери серій (рядками), які прибрали з бази: серія знову непереглянута
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
            // Серіал без нових серій лишається в списку до наступного відкриття сторінки (див. patchMoviePart)
            return {
                ...row,
                seasons,
                unwatchedCount,
                latestDate: seasons
                    .filter((s) => s.unwatchedCount > 0)
                    .reduce((max, s) => (s.airDate > max ? s.airDate : max), ''),
            }
        }))
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

    // copy — копія фільму, обрана кнопкою (одна папка — вона сама, кілька — вибір у вікні)
    const handleMovieCheck = useCallback(async (part, copy) => {
        try {
            // Повні дані копії: без них форма відкрилась би порожньою і збереження затерло б оцінку й коментар
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
                // Беремо повний обʼєкт папки зі списку: сайдбар підсвічує вибране
                // за order, тож самої назви замало
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
            // Копій може бути кілька: статус частини — найсильніший серед усіх. Змінена копія
            // тепер в обраній папці, решта лишаються як були
            const editedId = updated?._id || dialog.item._id
            const others = (savedIndex[`movie:${dialog.item.id}`] || []).filter((c) => c.mongoId !== editedId)
            patchMoviePart(dialog.item.id, () => ({
                status: getBestStatus([...others.map((c) => c.status), dialog.folder?.status || null]),
                hasDropped: [...others.map((c) => c.status), dialog.folder?.status].includes(FOLDER_STATUSES.DROPPED),
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

    // Фільм видалено з діалогу редагування: частина лишається в списку «нових», статус — за копіями, що залишились
    const handleMovieDeleted = useCallback(() => {
        if (!movieDialog) return
        const others = (savedIndex[`movie:${movieDialog.item.id}`] || []).filter((c) => c.mongoId !== movieDialog.item._id)
        patchMoviePart(movieDialog.item.id, () => ({
            status: getBestStatus(others.map((c) => c.status)),
            hasDropped: others.some((c) => c.status === FOLDER_STATUSES.DROPPED),
            mongoId: others[0]?.mongoId || null,
            folderName: others[0]?.folderName || null,
            saved: null,
        }))
    }, [movieDialog, savedIndex, patchMoviePart])

    // --- СЕРІЯ: позначити переглянутою або відредагувати ---
    const handleEpisodeMark = useCallback(async (row, seasonNumber, episodeNumber) => {
        const data = { dateAdded: toDateOnlyISO(new Date()), watchedCount: 1, rating: null, comment: '' }
        try {
            await instance.patch(`/tv/${row.mongoId}/season/${seasonNumber}/episode/${episodeNumber}`, data)
            patchEpisodes(row.key, seasonNumber, { [String(episodeNumber)]: data })
        } catch (err) { console.warn(err); alertError(err) }
    }, [patchEpisodes])

    // Позначити переглянутими всі непереглянуті серії сезону одним запитом.
    // Дія масова й скасувати її можна лише вручну по серії — тому відкриваємо діалог, де обирається
    // дата перегляду (за замовчуванням сьогодні) і підтверджується дія. Стан: { row, seasonNumber, episodeNumbers }.
    const [markDialog, setMarkDialog] = useState(null)
    const handleSeasonMarkAll = useCallback((row, seasonNumber, episodeNumbers) => {
        if (!episodeNumbers.length) return
        setMarkDialog({ row, seasonNumber, episodeNumbers })
    }, [])

    // Підтвердження в діалозі: позначаємо серії з обраною датою (null — без дати)
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

    // Видалити серію з бази (кнопка Delete в діалозі редагування): вона знову стає непереглянутою
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
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography variant="h6" color="text.secondary">
                    Please log in to see new releases
                </Typography>
            </Box>
        )
    }

    // Спінер лише на першому завантаженні. При перемиканні режиму шапка (разом з перемикачем)
    // лишається на місці — інакше повзунок не встиг би проїхати: компонент зникав би.
    if (isLoading && rows.length === 0 && !hasLoadedOnce) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress color="primary" />
            </Box>
        )
    }

    const totalNew = sortedRows.reduce((sum, row) => sum + row.unwatchedCount, 0)
    // Рядки, де нового вже не лишилось (щойно все позначили), ще на екрані, але в підсумок не входять
    const titlesWithNew = sortedRows.filter((row) => row.unwatchedCount > 0).length
    // Ще чекаємо: або вантажиться відповідь бекенда, або порожній список, який наповнюється з TMDB (перший візит без кешу) —
    // без цього на мить показалось би «все переглянуто»
    const isWaiting = isLoading || (refresh !== null && sortedRows.length === 0)
    const isDroppedView = view === VIEWS.DROPPED

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            {/* Шапка */}
            {/* Три колонки: заголовок | перемикач по центру | сортування. Крайні колонки рівні (1fr),
                тож перемикач завжди рівно посередині і не рухається, хоч би який був підсумок. */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
                alignItems: 'center',
                justifyItems: { xs: 'stretch', md: 'start' },
                gap: 2,
            }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="sectionTitle" color="text.main">
                        {isDroppedView ? 'Dropped' : 'New releases'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {isWaiting
                            ? 'Loading…'
                            : sortedRows.length === 0
                            ? (isDroppedView ? 'No dropped titles with new releases' : 'Everything you are watching is up to date')
                            : `${totalNew} new in ${titlesWithNew} ${titlesWithNew === 1 ? 'title' : 'titles'}${refresh ? ' · updating…' : ''}`}
                    </Typography>
                </Box>

                {/* Перемикач режиму: звичайні нові релізи / те саме по кинутих */}
                <SegmentedSwitch
                    value={switchView}
                    onChange={setSwitchView}
                    sx={{ justifySelf: 'center' }}
                    options={[
                        { value: VIEWS.ACTIVE, label: 'New' },
                        { value: VIEWS.DROPPED, label: 'Dropped' },
                    ]}
                />

                {/* Сортування лишається в розмітці завжди (просто невидиме), щоб перемикач не стрибав,
                    коли воно зникає на час завантаження чи при порожньому списку */}
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

                    {/* Вигляд частин колекції: картки або компактні рядки — той самий перемикач і налаштування, що в General */}
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

            {/* Список */}
            {isWaiting ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress color="primary" />
                </Box>
            ) : sortedRows.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                        {isDroppedView ? (
                            <>
                                Nothing here. Movies and shows from folders with the "Dropped" status that have new releases will appear here.
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
                onAfterDelete={handleMovieDeleted}
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />

            {/* Діалог дати для «Watch all» (весь сезон) — той самий, що на сторінці серіалу */}
            <MarkWatchedDialog
                open={Boolean(markDialog)}
                title={markDialog ? `${markDialog.row.title} · Season ${markDialog.seasonNumber}` : ''}
                description={markDialog
                    ? `Mark ${markDialog.episodeNumbers.length} remaining ${markDialog.episodeNumbers.length === 1 ? 'episode' : 'episodes'} as watched. Choose the date they were watched.`
                    : ''}
                onClose={() => setMarkDialog(null)}
                onConfirm={handleConfirmMarkAll}
            />

            {/* Діалог серії — той самий, що на сторінці серіалу */}
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
