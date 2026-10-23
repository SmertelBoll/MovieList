import { Box, Typography, CircularProgress, Chip, Card, CardMedia, Tooltip, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import { selectSavedCopies } from '../../redux/slices/SavedSlice'
import instance from '../../axios'
import { getTmdbLanguage } from '../../utils/languages'
import { cleanCollectionName } from '../../utils/tmdb'
import { alertError } from '../../alerts'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import ActorCart from '../../components/Carts/ActorCart'
import TimelineCart from '../../components/Carts/TimelineCart'
import ItemFolderButton from '../../components/ItemFolderButton'
import EditableValue from '../../components/EditableValue'
import StretchedLink from '../../components/StretchedLink'
import { scrollStripSx } from '../../theme/scrollbar'
import { fetchSavedDoc } from '../../utils/savedItems'
import { formatDateOnly } from '../../utils/dates'
import { IMAGE_DEFAULT, tmdbImage } from '../../utils/tmdbImage'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY

// Section title: h5 (1.5rem) is too big on narrow screens
const sectionTitleSx = { mb: 2, color: "text.main" }

function MoviePage({ isSaved = false }) {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { language } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)
    const [movie, setMovie] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const [currentFolderName, setCurrentFolderName] = useState(null)

    const [isOpenDialogAdd, setIsOpenDialogAdd] = useState(false)
    const [isOpenDialogEdit, setIsOpenDialogEdit] = useState(false)
    const [isDeleteItem, setIsDeleteItem] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    // Dialog item when it isn't the page's movie: a Timeline part or the chosen copy; null = the page's movie
    const [dialogItem, setDialogItem] = useState(null)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    const [itemFolders, setItemFolders] = useState([])
    // Copies from the saved index: the folder chip uses them to decide where to link.
    const savedCopies = useSelector(selectSavedCopies('movie', movie?.tmdbId))

    // Folder chip target: one copy in the folder -> its page; several (duplicates) -> the folder filtered by
    // title.
    const savedFolderPath = (folderName) => {
        const inFolder = savedCopies.filter((c) => c.folderName === folderName)
        return inFolder.length === 1
            ? `/user/movie/${inFolder[0].mongoId}`
            : `/folders/${encodeURIComponent(folderName)}?filter=${encodeURIComponent(movie.title)}`
    }
    const [isLoadingItemFolders, setIsLoadingItemFolders] = useState(true)

    const [collection, setCollection] = useState(null)

    const theme = useTheme()
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
    const overviewRef = useRef(null)
    const [overviewExpanded, setOverviewExpanded] = useState(false)
    const [overviewOverflows, setOverviewOverflows] = useState(false)

    const navigate = useNavigate()

    useEffect(() => {
        setIsLoading(true)

        const loadTmdb = (tmdbId, savedFields = {}) => {
            instance
                .get(`${process.env.REACT_APP_URL_TMDB}/movie/${tmdbId}`, {
                    params: {
                        api_key: API_KEY,
                        language: tmdbLanguage,
                        append_to_response: "credits"
                    }
                })
                .then((res) => {
                    setMovie({ ...res.data, media_type: "movie", tmdbId: res.data.id, ...savedFields })
                    setIsLoading(false)
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err, "Failed to load movie")
                    setIsLoading(false)
                })
        }

        if (isSaved) {
            instance
                .get(`/movie/mongo/${id}`)
                .then((res) => {
                    const saved = res.data.results
                    setCurrentFolderName(saved.folderName)
                    loadTmdb(saved.tmdbId, {
                        _id: saved._id,
                        tmdbId: saved.tmdbId,
                        rating: saved.rating,
                        comment: saved.comment,
                        dateAdded: saved.dateAdded,
                        updatedAt: saved.updatedAt,
                        customType: saved.customType
                    })
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err, "Failed to load movie")
                    setIsLoading(false)
                })
        } else {
            loadTmdb(id)
        }
    }, [id, isSaved, tmdbLanguage])

    useEffect(() => {
        if (isGetFolders && isAuth) {
            instance
                .get(`/folders`)
                .then((res) => {
                    setFolders(res.data.results)
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err)
                })
            setIsGetFolders(false)
        }
    }, [isGetFolders, isAuth])

    useEffect(() => {
        const tmdbId = movie?.tmdbId
        if (isAuth && tmdbId) {
            setIsLoadingItemFolders(true)
            instance
                .get(`/folders/movie/${tmdbId}`)
                .then((res) => {
                    setItemFolders(res.data.results)
                    setIsLoadingItemFolders(false)
                })
                .catch((err) => {
                    console.warn(err)
                    setIsLoadingItemFolders(false)
                })
        } else {
            setItemFolders([])
            setIsLoadingItemFolders(false)
        }
    }, [movie?.tmdbId, isAuth, isGetFolders])

    // belongs_to_collection comes with /movie/{id}, but the parts live in a separate /collection/{id}
    // endpoint.
    useEffect(() => {
        const collectionId = movie?.belongs_to_collection?.id
        if (!collectionId) {
            setCollection(null)
            return
        }

        let cancelled = false
        instance
            .get(`${process.env.REACT_APP_URL_TMDB}/collection/${collectionId}`, {
                params: {
                    api_key: API_KEY,
                    language: tmdbLanguage
                }
            })
            .then((res) => {
                if (!cancelled) setCollection(res.data)
            })
            .catch((err) => {
                // The collection block is optional, so no alert on failure.
                console.warn(err)
                if (!cancelled) setCollection(null)
            })

        return () => { cancelled = true }
        // tmdbLanguage dependency: the collection id doesn't change, so without it part titles would stay in
        // the old language.
    }, [movie?.belongs_to_collection?.id, tmdbLanguage])

    // Parts in chronological order; no release date -> last
    const timelineParts = useMemo(() => {
        if (!collection?.parts) return []
        return [...collection.parts].sort((a, b) => {
            const dateA = a.release_date || ''
            const dateB = b.release_date || ''
            if (!dateA && !dateB) return 0
            if (!dateA) return 1
            if (!dateB) return -1
            return dateA.localeCompare(dateB)
        })
    }, [collection])

    // Whether the overview really overflows the collapsed view, otherwise "Show more" lies. Not recomputed
    // when expanded: scrollHeight always equals clientHeight there.
    useEffect(() => {
        if (!isSmall) {
            setOverviewOverflows(false)
            return
        }
        if (overviewExpanded) return
        const el = overviewRef.current
        if (!el) return
        setOverviewOverflows(el.scrollHeight > el.clientHeight + 1)
    }, [movie?.overview, isSmall, overviewExpanded])

    useEffect(() => {
        setOverviewExpanded(false)
    }, [movie?.tmdbId])

    // The collection name suffix is localized, so clean it with the shared helper.
    const franchiseName = cleanCollectionName(collection?.name)

    const handleOpenDialogAdd = () => {
        setSelectedFolder(false)
        setIsOpenDialogAdd(true)
    }
    const handleOpenDialogEdit = () => {
        setSelectedFolder(currentFolderName ? { name: currentFolderName } : false)
        setIsOpenDialogEdit(true)
    }
    const handleDeleteItem = () => {
        setSelectedFolder(currentFolderName ? { name: currentFolderName } : false)
        setIsDeleteItem(true)
    }
    const handleCloseDialog = () => {
        setIsOpenDialogAdd(false)
        setIsOpenDialogEdit(false)
        setIsDeleteItem(false)
        setSelectedFolder(false)
        setDialogItem(null)
    }

    // Folder object from the page's folder list (the dialog sidebar highlights by order).
    const folderOfCopy = (copy) => folders.find((f) => f.name === copy.folderName) || { name: copy.folderName, status: copy.status }

    // Edit/delete of the copy chosen via the button on the TMDB movie page (on a copy page the button calls
    // the regular handleOpenDialogEdit / handleDeleteItem).
    const handleEditCopy = async (copy) => {
        if (!copy) return handleOpenDialogEdit()
        try {
            const doc = await fetchSavedDoc('movie', copy.mongoId)
            setDialogItem({ ...movie, ...doc })
            setSelectedFolder(folderOfCopy(copy))
            setIsOpenDialogEdit(true)
        } catch (err) {
            console.warn(err)
            alertError(err)
        }
    }
    const handleDeleteCopy = (copy) => {
        if (!copy) return handleDeleteItem()
        setDialogItem({ ...movie, _id: copy.mongoId })
        setSelectedFolder(folderOfCopy(copy))
        setIsDeleteItem(true)
    }

    // Timeline: add a franchise part / edit a saved one. Same dialog as for the page's movie, just a
    // different item.
    const partItem = (part) => ({ id: part.id, title: part.title, media_type: 'movie' })
    const handleTimelineAdd = (part) => {
        setDialogItem(partItem(part))
        setSelectedFolder(false)
        setIsOpenDialogAdd(true)
    }
    const handleTimelineEdit = async (part, copy) => {
        try {
            const doc = await fetchSavedDoc('movie', copy.mongoId)
            setDialogItem({ ...partItem(part), ...doc })
            setSelectedFolder(folderOfCopy(copy))
            setIsOpenDialogEdit(true)
        } catch (err) {
            console.warn(err)
            alertError(err)
        }
    }

    // In-place comment/rating edit. Other fields are sent as is so nothing is wiped.
    const saveFields = async (changes) => {
        try {
            const res = await instance.patch(`/movie/${movie._id}`, {
                comment: movie.comment,
                rating: movie.rating,
                dateAdded: movie.dateAdded,
                customType: movie.customType,
                ...changes,
            })
            const saved = res.data.results
            setMovie((prev) => ({ ...prev, comment: saved.comment, rating: saved.rating, dateAdded: saved.dateAdded, updatedAt: saved.updatedAt }))
        } catch (err) {
            console.warn(err)
            alertError(err)
            throw err
        }
    }
    const handleSaveReview = (comment) => saveFields({ comment })
    const handleSaveRatingDate = ({ rating, dateAdded }) => saveFields({ rating, dateAdded })

    const handleItemSaved = (updated) => {
        // Another item was saved (a Timeline part, someone else's copy): leave the page data alone.
        if (isSaved && !dialogItem) {
            setMovie(prev => ({ ...prev, ...updated }))
            if (updated.folderName) setCurrentFolderName(updated.folderName)
        }
        setIsGetFolders(true)
    }


    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress color="primary" />
            </Box>
        )
    }

    if (!movie) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6" color="text.secondary">
                    Movie not found
                </Typography>
            </Box>
        )
    }

    // Poster is portrait, backdrop landscape; card and background take different images: phone card = backdrop,
    // background = poster; desktop the reverse.
    const posterUrl = tmdbImage(movie.poster_path, 'w500')
    const backdropUrl = tmdbImage(movie.backdrop_path, 'w780')
    const backdropFullUrl = tmdbImage(movie.backdrop_path, 'original')

    const heroImage = (isSmall ? backdropUrl || posterUrl : posterUrl || backdropUrl) || IMAGE_DEFAULT
    const heroBackground = isSmall
        ? posterUrl || backdropFullUrl
        : backdropFullUrl || posterUrl

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
            {/* Hero Section */}
            <Box sx={{
                position: "relative",
                minHeight: { xs: "auto", sm: 400 },
                borderRadius: 2,
                overflow: "hidden",
                background: [
                    `linear-gradient(${theme.palette.overlay.soft}, ${theme.palette.overlay.soft})`,
                    heroBackground && `url(${heroBackground})`,
                ].filter(Boolean).join(", "),
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {isAuth && (
                    <ItemFolderButton
                        tone="hero"
                        mediaType="movie"
                        tmdbId={movie.tmdbId}
                        itemTitle={movie.title}
                        isCopy={isSaved}
                        onAdd={handleOpenDialogAdd}
                        onEdit={handleEditCopy}
                        onDelete={handleDeleteCopy}
                    />
                )}
                <Box sx={{
                    display: "flex",
                    // Column on phones, row from sm: at 360px the poster would eat almost all the width.
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 2, sm: 3 },
                    alignItems: "center",
                    maxWidth: "1200px",
                    width: "100%",
                    minWidth: 0,
                    p: { xs: 2, sm: 3 }
                }}>
                    {/* Poster */}
                    <Tooltip title={isSaved ? "Open the movie page" : ""} arrow placement="top">
                        <Card
                            sx={{
                                position: "relative",
                                // Phones: wide 16:9 frame full width; the vertical poster took too much
                                // height.
                                width: { xs: "100%", sm: 170, md: 200 },
                                height: { xs: "auto", sm: 255, md: 300 },
                                flexShrink: 0,
                                boxShadow: 3,
                                borderRadius: 2,
                                ...(isSaved && {
                                    cursor: "pointer",
                                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                    '@media (hover: hover) and (pointer: fine)': { "&:hover": {
                                        transform: (theme) => theme.hoverLift,
                                        boxShadow: 6
                                    } }
                                })
                            }}
                        >
                            {isSaved && <StretchedLink to={`/movie/${movie.tmdbId}`} label="Open the movie page" />}
                            <CardMedia
                                component="img"
                                image={heroImage}
                                sx={{
                                    width: "100%",
                                    height: { xs: "auto", sm: "100%" },
                                    aspectRatio: { xs: "16 / 9", sm: "auto" },
                                    objectFit: "cover",
                                    display: "block"
                                }}
                            />
                        </Card>
                    </Tooltip>

                    {/* Movie Info */}
                    <Box sx={{
                        color: "overlay.onImage",
                        flex: 1,
                        minWidth: 0,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: { xs: 1, sm: 2 },
                        textAlign: { xs: "center", sm: "left" },
                        alignItems: { xs: "center", sm: "stretch" }
                    }}>
                        {/* Title */}
                        <Typography
                            variant="heroTitle"
                            sx={{ overflowWrap: "anywhere" }}
                        >
                            {movie.title}
                        </Typography>

                        {/* Genres */}
                        <Box sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            width: "100%",
                            justifyContent: { xs: "center", sm: "flex-start" }
                        }}>
                            {movie.genres?.map((genre) => (
                                <Chip
                                    key={genre.id}
                                    label={genre.name}
                                    size="small"
                                    component={Link}
                                    to={`/genre/${genre.id}`}
                                    sx={{
                                        cursor: 'pointer',
                                        backgroundColor: "overlay.chip",
                                        color: "overlay.onImage",
                                        transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                        '@media (hover: hover) and (pointer: fine)': {
                                            '&.MuiChip-root:hover': {
                                                backgroundColor: 'yellow.main',
                                                color: 'text.dark',
                                                borderColor: 'text.dark',
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </Box>

                        <Box sx={{ width: "100%" }}>
                            <Typography
                                ref={overviewRef}
                                variant="body1"
                                onClick={overviewOverflows ? () => setOverviewExpanded((v) => !v) : undefined}
                                sx={{
                                    opacity: 0.9,
                                    textAlign: "left",
                                    ...(overviewOverflows && { cursor: "pointer" }),
                                    ...(isSmall && !overviewExpanded && {
                                        display: "-webkit-box",
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    })
                                }}
                            >
                                {movie.overview}
                            </Typography>

                            {overviewOverflows && (
                                <Typography
                                    component="button"
                                    variant="body2"
                                    onClick={() => setOverviewExpanded((v) => !v)}
                                    sx={{
                                        mt: 1,
                                        p: 0,
                                        border: "none",
                                        background: "none",
                                        font: "inherit",
                                        fontWeight: 700,
                                        color: "yellow.main",
                                        cursor: "pointer",
                                        display: "block"
                                    }}
                                >
                                    {overviewExpanded ? "Show less" : "Show more"}
                                </Typography>
                            )}
                        </Box>

                        {/* Rating and Release Date */}
                        <Box sx={{
                            display: "flex",
                            gap: { xs: 2, sm: 3 },
                            alignItems: "center",
                            flexWrap: "wrap",
                            width: "100%",
                            justifyContent: { xs: "center", sm: "flex-start" }
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                ⭐ {movie.vote_average?.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {formatDateOnly(movie.release_date)} • {movie.runtime} min
                            </Typography>
                        </Box>

                        {/* Block with saved folders */}
                        {isAuth && !isLoadingItemFolders && itemFolders.length > 0 && (
                            <Box sx={{ width: "100%" }}>
                                <Box sx={{
                                    display: "flex",
                                    gap: { xs: 1, sm: 2 },
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    justifyContent: { xs: "center", sm: "flex-start" }
                                }}>
                                    <Typography variant="body1">
                                        Saved in:
                                    </Typography>
                                    {itemFolders.map((folder) => (
                                        <Chip
                                            key={folder.name}
                                            label={folder.name}
                                            variant="outlined"
                                            component={Link}
                                            to={savedFolderPath(folder.name)}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: "overlay.chipSubtle",
                                                color: "overlay.onImage",
                                                borderColor: "overlay.chip",
                                                transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                                '@media (hover: hover) and (pointer: fine)': {
                                                    '&.MuiChip-root:hover': {
                                                        backgroundColor: 'yellow.main',
                                                        color: 'text.dark',
                                                        borderColor: 'text.dark',
                                                    }
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {isSaved && (
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 3 } }}>
                    <EditableValue
                        type="text"
                        value={movie.comment}
                        onSave={handleSaveReview}
                        sx={{ order: { xs: 2, sm: 1 }, flex: 1, minWidth: 0, borderRadius: 2, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}
                    />

                    <Box bgcolor="bg.second" sx={{ order: { xs: 1, sm: 2 }, flex: "0 0 auto", borderRadius: 2, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 1 }}>
                        <EditableValue
                            type="ratingDate"
                            value={{ rating: movie.rating, dateAdded: movie.dateAdded }}
                            onSave={handleSaveRatingDate}
                        />
                    </Box>
                </Box>
            )}

            {timelineParts.length > 1 && (
                <Box>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 2, flexWrap: "wrap" }}>
                        <Typography variant="sectionTitle" color="text.main">
                            Timeline
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {franchiseName} · {timelineParts.length} parts
                        </Typography>
                    </Box>
                    <Box sx={scrollStripSx}>
                        {timelineParts.map((part) => (
                            <TimelineCart
                                key={part.id}
                                part={part}
                                isCurrent={part.id === movie.tmdbId}
                                onAdd={handleTimelineAdd}
                                onEdit={handleTimelineEdit}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Cast Section */}
            {movie.credits?.cast && movie.credits.cast.length > 0 && (
                <Box>
                    <Typography variant="sectionTitle" sx={sectionTitleSx}>
                        Cast
                    </Typography>
                    <Box sx={scrollStripSx}>
                        {movie.credits.cast.map((actor) => (
                            <ActorCart
                                key={actor.id}
                                person={actor}
                                role={actor.character}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Crew Section */}
            {movie.credits?.crew && movie.credits.crew.length > 0 && (
                <Box>
                    <Typography variant="sectionTitle" sx={sectionTitleSx}>
                        Crew
                    </Typography>
                    <Box sx={scrollStripSx}>
                        {movie.credits.crew
                            .filter(member => ['Director', 'Producer', 'Writer', 'Screenplay'].includes(member.job))
                            .map((member) => (
                                <ActorCart
                                    key={member.id}
                                    person={member}
                                    role={member.job}
                                />
                            ))}
                    </Box>
                </Box>
            )}

            {/* Production Info */}
            {movie.production_companies && movie.production_companies.length > 0 && (
                <Box>
                    <Typography variant="sectionTitle" sx={sectionTitleSx}>
                        Production Companies
                    </Typography>
                    <Box sx={scrollStripSx}>
                        {movie.production_companies.map((company) => (
                            <Chip
                                key={company.id}
                                label={company.name}
                                variant="outlined"
                                component={Link}
                                to={`/company/${company.id}`}
                                sx={{
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                    '@media (hover: hover) and (pointer: fine)': {
                                        '&.MuiChip-root:hover': {
                                            backgroundColor: 'yellow.main',
                                            color: 'text.dark',
                                            borderColor: 'text.dark',
                                        }
                                    }
                                }}
                            />

                        ))}
                    </Box>
                </Box>
            )}

            <ItemSaveDialog
                isOpenDialogAdd={isOpenDialogAdd}
                isOpenDialogEdit={isOpenDialogEdit}
                isDeleteItem={isDeleteItem}
                handleCloseDialog={handleCloseDialog}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                selectedItem={dialogItem || movie}
                onSaved={handleItemSaved}
                // After deleting the copy the page is open on, go back.
                onAfterDelete={() => { if (isSaved && !dialogItem) navigate(-1) }}
                // sidebar props
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />
        </Box>
    )
}

export default MoviePage
