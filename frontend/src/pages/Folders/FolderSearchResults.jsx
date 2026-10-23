import { Box, Chip, CircularProgress, Collapse, Grid2, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import instance from '../../axios'
import { alertError } from '../../alerts'
import { NO_TAG, setViewMode } from '../../redux/slices/ConfigSlice'
import { getTmdbLanguage } from '../../utils/languages'
import ItemCart from '../../components/GereralItemList/ItemCart'
import ItemRow from '../../components/GereralItemList/ItemRow'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import SegmentedSwitch from '../../components/SegmentedSwitch'
import FolderThumb from '../../components/SideBar/FolderThumb'
import { getStatusChipSx, getStatusLabel } from '../../utils/folderStatus'

const TMDB_URL = process.env.REACT_APP_URL_TMDB
const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const MAX_ITEMS = 80

// TMDB search in the UI language: finds titles the user saved under another name (e.g. saved in English, searched in
// Ukrainian).
async function searchTmdb(type, query, language) {
    try {
        const params = new URLSearchParams({ api_key: API_KEY, language, query })
        const res = await fetch(`${TMDB_URL}/search/${type}?${params}`)
        if (!res.ok) return []
        return (await res.json()).results || []
    } catch {
        return []
    }
}

const detailsCache = new Map()
function fetchDetails(type, id, language) {
    const key = `${language}:${type}:${id}`
    if (!detailsCache.has(key)) {
        detailsCache.set(key, fetch(`${TMDB_URL}/${type}/${id}?api_key=${API_KEY}&language=${language}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null))
    }
    return detailsCache.get(key)
}

// Search over all folders, grouped by folder: "Watched" and its items under it, as rows or cards (same switch and same
// item components as the folder pages).
function FolderSearchResults({ query, folders, setFolders }) {
    const dispatch = useDispatch()
    const { language, typeTMDB, customTypes, viewMode } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)

    const [saved, setSaved] = useState([])
    const [tmdbData, setTmdbData] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [reloadKey, setReloadKey] = useState(0)
    // Folder names the user collapsed; kept across queries
    const [collapsed, setCollapsed] = useState(() => new Set())
    const toggleFolder = (name) => setCollapsed((prev) => {
        const next = new Set(prev)
        if (!next.delete(name)) next.add(name)
        return next
    })
    const [dialog, setDialog] = useState(null) // { mode: 'edit' | 'delete', item, folder }
    const lastQuery = useRef('')
    const dialogCount = useRef(0)

    useEffect(() => {
        let cancelled = false
        // After an edit/delete the list refreshes in place; the spinner is only for a new query.
        const queryKey = `${query}|${tmdbLanguage}`
        if (lastQuery.current !== queryKey) setIsLoading(true)
        lastQuery.current = queryKey
        ;(async () => {
            try {
                const [movies, tvs] = await Promise.all([
                    searchTmdb('movie', query, tmdbLanguage),
                    searchTmdb('tv', query, tmdbLanguage),
                ])
                const { data } = await instance.get('/items/search', {
                    params: {
                        query,
                        movieIds: movies.map((m) => m.id).join(','),
                        tvIds: tvs.map((t) => t.id).join(','),
                    },
                })
                const found = {}
                movies.forEach((m) => { found[`movie:${m.id}`] = m })
                tvs.forEach((t) => { found[`tv:${t.id}`] = t })
                // Details only for what the search results didn't already bring
                await Promise.all(data.results.slice(0, MAX_ITEMS).map(async (item) => {
                    const key = `${item.media_type}:${item.tmdbId}`
                    if (!found[key]) found[key] = await fetchDetails(item.media_type, item.tmdbId, tmdbLanguage)
                }))
                if (cancelled) return
                setTmdbData(found)
                setSaved(data.results)
            } catch (err) {
                if (cancelled) return
                console.warn(err)
                alertError(err)
                setSaved([])
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [query, tmdbLanguage, reloadKey])

    const refresh = useCallback(() => setReloadKey((key) => key + 1), [])

    const groups = useMemo(() => {
        const matchesTags = (item) => customTypes.length === 0
            || item.customType.some((tag) => customTypes.includes(tag))
            || (customTypes.includes(NO_TAG) && item.customType.length === 0)
        const visible = saved.filter((item) => typeTMDB.includes(item.media_type) && matchesTags(item)).slice(0, MAX_ITEMS)
        return [...folders]
            .sort((a, b) => b.order - a.order)
            .map((folder) => ({
                folder,
                // Same shape the folder pages use: TMDB data with the saved document on top
                items: visible
                    .filter((item) => item.folders.some((f) => f.name === folder.name))
                    .map((item) => ({
                        id: item.tmdbId,
                        title: item.tmdbTitle,
                        name: item.tmdbTitle,
                        ...tmdbData[`${item.media_type}:${item.tmdbId}`],
                        ...item,
                        _id: item.mongoId,
                    })),
            }))
            .filter((group) => group.items.length > 0)
    }, [saved, tmdbData, folders, typeTMDB, customTypes])

    const itemProps = (item, folder) => ({
        item,
        dbType: 'mongo',
        mediaType: item.media_type,
        onEditItem: () => setDialog({ mode: 'edit', item, folder }),
        onDeleteItem: () => setDialog({ mode: 'delete', item, folder, id: ++dialogCount.current }),
        isDate: true,
        isRating: true,
        isComment: true,
        isFolderPage: true,
    })

    // Items hang off a line under the folder name
    const branch = {
        ml: 1,
        pl: { xs: 1.5, sm: 2.5 },
        borderLeft: '2px solid',
        borderColor: 'divider',
    }

    const total = groups.reduce((sum, group) => sum + group.items.length, 0)

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress color="primary" />
            </Box>
        )
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="desc1" color="text.main">
                    {total === 0 ? 'Nothing found' : `${total} ${total === 1 ? 'result' : 'results'}`}
                </Typography>
                <SegmentedSwitch
                    compact
                    value={viewMode}
                    onChange={(mode) => dispatch(setViewMode(mode))}
                    sx={{ ml: 'auto' }}
                    options={[
                        { value: 'cards', label: <GridViewIcon fontSize="small" />, ariaLabel: 'Show as cards' },
                        { value: 'list', label: <ViewListIcon fontSize="small" />, ariaLabel: 'Show as list' },
                    ]}
                />
            </Box>

            {groups.map(({ folder, items }) => {
                const isCollapsed = collapsed.has(folder.name)
                return (
                <Box key={folder.name}>
                    <Box
                        role="button"
                        tabIndex={0}
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleFolder(folder.name)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                toggleFolder(folder.name)
                            }
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            mb: isCollapsed ? 0 : 1.5,
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: 'bg.main',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'background-color 0.15s',
                            '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: 'bg.selected' } },
                        }}
                    >
                        <FolderThumb folder={folder} size={32} />
                        <Typography variant="p" color="text.main" sx={{ minWidth: 0, wordBreak: 'break-word' }}>
                            {folder.name}
                        </Typography>
                        <Chip
                            size="small"
                            label={getStatusLabel(folder.status)}
                            sx={{ ...getStatusChipSx(folder.status), height: 22, flexShrink: 0 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>
                            {items.length}
                        </Typography>
                        <ExpandMoreIcon sx={{
                            color: 'text.main',
                            flexShrink: 0,
                            transition: 'transform 0.2s',
                            transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                        }} />
                    </Box>
                    <Collapse in={!isCollapsed} unmountOnExit>
                    {viewMode === 'list' ? (
                        <Box sx={{ ...branch, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {items.map((item) => (
                                <ItemRow key={item._id} {...itemProps(item, folder)} />
                            ))}
                        </Box>
                    ) : (
                        <Box sx={branch}>
                            <Grid2 container spacing={2}>
                                {items.map((item) => (
                                    <Grid2 key={item._id} size={{ xs: 6, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }}>
                                        <ItemCart {...itemProps(item, folder)} isImage isTitle />
                                    </Grid2>
                                ))}
                            </Grid2>
                        </Box>
                    )}
                    </Collapse>
                </Box>
                )
            })}

            {/* The delete prompt runs when the dialog mounts with the flag set; a new key per delete makes a second delete after a cancelled prompt ask again. */}
            <ItemSaveDialog
                key={dialog?.mode === 'delete' ? `delete-${dialog.id}` : 'main'}
                isOpenDialogAdd={false}
                isOpenDialogEdit={dialog?.mode === 'edit'}
                isDeleteItem={dialog?.mode === 'delete'}
                handleCloseDialog={() => setDialog(null)}
                selectedFolder={dialog?.folder ?? false}
                setSelectedFolder={(folder) => setDialog((prev) => (prev ? { ...prev, folder } : prev))}
                selectedItem={dialog?.item ?? {}}
                onSaved={refresh}
                onAfterDelete={refresh}
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={() => { }}
            />
        </Box>
    )
}

export default FolderSearchResults
