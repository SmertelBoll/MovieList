import { Box, Typography, CircularProgress, Chip, Card, CardMedia, IconButton, Rating, Tooltip, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import { formatRatingLabel } from '../../utils/ratingSystem'
import instance from '../../axios'
import { getTmdbLanguage } from '../../utils/languages'
import { alertError } from '../../alerts'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import ActorCart from '../../components/Carts/ActorCart'
import TimelineCart from '../../components/Carts/TimelineCart'
import DropdownMenu from '../../components/_customMUI/DropdownMenu'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const IMAGE_BASE_URL_ORIGINAL = `${process.env.REACT_APP_TMDB_IMG}/original`; // базовий URL для отримання зображень
const IMAGE_BASE_URL_W500 = `${process.env.REACT_APP_TMDB_IMG}/w500`;         // базовий URL для отримання зображень
const IMAGE_BASE_URL_W780 = `${process.env.REACT_APP_TMDB_IMG}/w780`;         // горизонтальний кадр для вузьких екранів
const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

// Заголовок секції: на вузьких екранах h5 (1.5rem) завеликий
const sectionTitleSx = { mb: 2, fontSize: { xs: "1.25rem", sm: "1.5rem" } }

// Горизонтальна стрічка карток. Тримається в межах падінгу контейнера,
// щоб смуга прокрутки не впиралась у краї екрана.
const scrollStripSx = {
    display: "flex",
    gap: 2,
    overflowX: "auto",
    pt: 1,
    pb: 2,
    scrollSnapType: { xs: "x proximity", sm: "none" },
    WebkitOverflowScrolling: "touch",
    "& > *": { scrollSnapAlign: { xs: "start", sm: "none" } },
    "&::-webkit-scrollbar": {
        height: { xs: 4, sm: 8 },
    },
    "&::-webkit-scrollbar-track": {
        backgroundColor: "action.hover",
        borderRadius: 4,
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "text.secondary",
        borderRadius: 4,
        "&:hover": {
            backgroundColor: "text.primary",
        },
    },
}

function MoviePage({ isSaved = false }) {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])
    const { language } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)
    const [movie, setMovie] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Папка, у якій збережено цей фільм (тільки для збереженого фільму)
    const [currentFolderName, setCurrentFolderName] = useState(null)

    // Стани для діалогу
    const [isOpenDialogAdd, setIsOpenDialogAdd] = useState(false)
    const [isOpenDialogEdit, setIsOpenDialogEdit] = useState(false)
    const [isDeleteItem, setIsDeleteItem] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    const [itemFolders, setItemFolders] = useState([]) // Папки, де є цей фільм
    const [isLoadingItemFolders, setIsLoadingItemFolders] = useState(true) // Завантаження папок, де є цей фільм

    // Колекція TMDB (франшиза) — усі частини цього фільму
    const [collection, setCollection] = useState(null)

    // На вузьких екранах опис згортаємо і розкриваємо кліком
    const theme = useTheme()
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
    const overviewRef = useRef(null)
    const [overviewExpanded, setOverviewExpanded] = useState(false)
    const [overviewOverflows, setOverviewOverflows] = useState(false)

    const navigate = useNavigate()

    // Завантаження даних фільму з TMDB (за потреби — спочатку дані зі збереженого документа mongo)
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

    // Завантаження папок користувача
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

    // Завантаження папок, де є цей фільм
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

    // Завантаження колекції: belongs_to_collection приходить разом з /movie/{id},
    // але самі частини лежать в окремому ендпоінті /collection/{id}
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
                // Колекція — необов'язковий блок, тому не показуємо алерт користувачу
                console.warn(err)
                if (!cancelled) setCollection(null)
            })

        return () => { cancelled = true }
        // tmdbLanguage — інакше при зміні мови назви частин лишились би старими:
        // id колекції не змінюється, тож без цієї залежності запит не повторився б
    }, [movie?.belongs_to_collection?.id, tmdbLanguage])

    // Частини колекції в хронологічному порядку; без дати виходу — в кінець
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

    // Чи справді опис не влазить у згорнутий вигляд — інакше кнопка "Show more" бреше.
    // У розгорнутому стані не переобчислюємо: там scrollHeight завжди дорівнює clientHeight.
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

    // Скидаємо стан при переході на інший фільм
    useEffect(() => {
        setOverviewExpanded(false)
    }, [movie?.tmdbId])

    // TMDB називає колекції "<Франшиза> Collection" — прибираємо хвіст, щоб не дублювати слово
    const franchiseName = (collection?.name || '').replace(/\s*collection\s*$/i, '')

    // Функції для роботи з діалогом
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
    }

    // Оновлюємо дані одразу на фронті після збереження (без перезавантаження сторінки)
    const handleItemSaved = (updated) => {
        if (isSaved) {
            setMovie(prev => ({ ...prev, ...updated }))
            if (updated.folderName) setCurrentFolderName(updated.folderName)
        }
        setIsGetFolders(true) // оновити блок "Saved in" без спіннера сторінки
    }

    const savedMenuItems = [
        { key: 'Add', label: 'Add', onClick: handleOpenDialogAdd },
        { key: 'Edit', label: 'Edit', onClick: handleOpenDialogEdit },
        { key: 'Delete', label: 'Delete', onClick: handleDeleteItem },
    ]

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

    // Постер вертикальний, backdrop горизонтальний. Картка і фон завжди беруть різні
    // зображення, щоб на жодній ширині не дублювалось одне й те саме:
    //   телефон  — картка backdrop (горизонтальна), фон постер (вертикальний)
    //   десктоп  — картка постер (вертикальна),     фон backdrop (горизонтальний)
    const posterUrl = movie.poster_path ? `${IMAGE_BASE_URL_W500}${movie.poster_path}` : null
    const backdropUrl = movie.backdrop_path ? `${IMAGE_BASE_URL_W780}${movie.backdrop_path}` : null
    const backdropFullUrl = movie.backdrop_path ? `${IMAGE_BASE_URL_ORIGINAL}${movie.backdrop_path}` : null

    const heroImage = (isSmall ? backdropUrl || posterUrl : posterUrl || backdropUrl) || IMAGE_DEFAULT
    const heroBackground = isSmall
        ? posterUrl || backdropFullUrl
        : backdropFullUrl || posterUrl

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
            {/* Hero Section */}
            <Box sx={{
                position: "relative",
                // На мобільному висоту диктує вміст, на десктопі — фіксовані 400px
                minHeight: { xs: "auto", sm: 400 },
                borderRadius: 2,
                overflow: "hidden",
                background: [
                    "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7))",
                    heroBackground && `url(${heroBackground})`,
                ].filter(Boolean).join(", "),
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {/* Кнопка дій для авторизованих користувачів */}
                {isAuth && (
                    isSaved
                        ? (
                            <DropdownMenu
                                width={140}
                                items={savedMenuItems}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                renderTrigger={({ onClick }) => (
                                    <IconButton
                                        aria-label="edit saved movie"
                                        onClick={onClick}
                                        sx={{
                                            position: "absolute",
                                            right: { xs: 12, sm: 20 },
                                            top: { xs: 12, sm: 20 },
                                            backgroundColor: "white",
                                            opacity: 0.9,
                                            zIndex: 2,
                                            borderRadius: 2,
                                            '&:hover': {
                                                opacity: 1,
                                                backgroundColor: "yellow.main",
                                                '& svg': { color: "text.dark" },
                                            }
                                        }}
                                    >
                                        <MoreVertIcon sx={{ opacity: 1, color: "text.main" }} />
                                    </IconButton>
                                )}
                            />
                        )
                        : (
                            <IconButton
                                aria-label="add to folder"
                                onClick={handleOpenDialogAdd}
                                sx={{
                                    position: "absolute",
                                    right: { xs: 12, sm: 20 },
                                    top: { xs: 12, sm: 20 },
                                    backgroundColor: "white",
                                    opacity: 0.9,
                                    zIndex: 2,
                                    borderRadius: 2,
                                    '&:hover': {
                                        opacity: 1,
                                        backgroundColor: "yellow.main",
                                        '& svg': { color: "text.dark" },
                                    }
                                }}
                            >
                                <AddIcon sx={{ opacity: 1, color: "text.main" }} />
                            </IconButton>
                        )
                )}
                <Box sx={{
                    display: "flex",
                    // Вертикально на телефоні, горизонтально від sm — інакше на 360px
                    // постер з'їдає майже всю ширину і тексту не лишається місця
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
                            onClick={isSaved ? () => navigate(`/movie/${movie.tmdbId}`) : undefined}
                            sx={{
                                // На телефоні — широкий кадр 16:9 на всю ширину:
                                // вертикальний постер з'їдав забагато висоти
                                width: { xs: "100%", sm: 170, md: 200 },
                                height: { xs: "auto", sm: 255, md: 300 },
                                flexShrink: 0,
                                boxShadow: 3,
                                borderRadius: 2,
                                ...(isSaved && {
                                    cursor: "pointer",
                                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: 6
                                    }
                                })
                            }}
                        >
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
                        color: "white",
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
                            variant="h3"
                            sx={{
                                fontWeight: "bold",
                                fontSize: { xs: "1.5rem", sm: "2.125rem", md: "3rem" },
                                lineHeight: 1.2,
                                overflowWrap: "anywhere"
                            }}
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
                                    onClick={() => navigate(`/genre/${genre.id}`)}
                                    sx={{
                                        cursor: 'pointer',
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        color: "white",
                                        transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                        '&.MuiChip-root:hover': {
                                            backgroundColor: 'yellow.main',
                                            color: 'text.dark',
                                            borderColor: 'text.dark',
                                        }
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Overview — на вузькому екрані згорнутий до 4 рядків, розкривається кліком */}
                        <Box sx={{ width: "100%" }}>
                            <Typography
                                ref={overviewRef}
                                variant="body1"
                                onClick={overviewOverflows ? () => setOverviewExpanded((v) => !v) : undefined}
                                sx={{
                                    opacity: 0.9,
                                    // Довгий абзац читається погано по центру — завжди зліва
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
                                {movie.release_date} • {movie.runtime} min
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
                                            onClick={() => navigate(`/folders/${folder.name}?filter=${encodeURIComponent(movie.title)}`)}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                color: "white",
                                                borderColor: "rgba(255,255,255,0.2)",
                                                transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                                '&.MuiChip-root:hover': {
                                                    backgroundColor: 'yellow.main',
                                                    color: 'text.dark',
                                                    borderColor: 'text.dark',
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

            {/* User review (тільки для збереженого фільму) */}
            {isSaved && (
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 3 } }}>
                    {/* Коментар (займає всю решту місця) */}
                    <Box bgcolor="bg.second" sx={{ flex: 1, minWidth: 0, borderRadius: 2, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography variant="h5" color="text.main" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>My review</Typography>
                        <Typography variant="body1" color="text.main" sx={{ whiteSpace: "pre-wrap" }}>
                            {movie.comment || "No comment"}
                        </Typography>
                    </Box>

                    {/* Оцінка та дати (під розмір вмісту) */}
                    <Box bgcolor="bg.second" sx={{ flex: "0 0 auto", borderRadius: 2, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Rating
                                name="user-rating"
                                value={(movie.rating || 0) / 20}
                                precision={0.1}
                                readOnly
                            />
                            <Typography variant="h6" color="text.main" sx={{ whiteSpace: "nowrap" }}>
                                {movie.rating == null ? "-" : formatRatingLabel(movie.rating, ratingSystem)}
                            </Typography>
                        </Box>
                        {movie.dateAdded && (
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                Added: {movie.dateAdded.split('T')[0]}
                            </Typography>
                        )}
                        {movie.updatedAt && (
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                Updated: {movie.updatedAt.split('T')[0]}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}

            {/* Timeline Section — частини франшизи (тільки якщо їх більше однієї) */}
            {timelineParts.length > 1 && (
                <Box>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 2, flexWrap: "wrap" }}>
                        <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
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
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Cast Section */}
            {movie.credits?.cast && movie.credits.cast.length > 0 && (
                <Box>
                    <Typography variant="h5" sx={sectionTitleSx}>
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
                    <Typography variant="h5" sx={sectionTitleSx}>
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
                    <Typography variant="h5" sx={sectionTitleSx}>
                        Production Companies
                    </Typography>
                    <Box sx={scrollStripSx}>
                        {movie.production_companies.map((company) => (
                            <Chip
                                key={company.id}
                                label={company.name}
                                variant="outlined"
                                onClick={() => navigate(`/company/${company.id}`)}
                                sx={{
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                    '&.MuiChip-root:hover': {
                                        backgroundColor: 'yellow.main',
                                        color: 'text.dark',
                                        borderColor: 'text.dark',
                                    }
                                }}
                            />

                        ))}
                    </Box>
                </Box>
            )}

            {/* Діалог додавання / редагування / видалення */}
            <ItemSaveDialog
                isOpenDialogAdd={isOpenDialogAdd}
                isOpenDialogEdit={isOpenDialogEdit}
                isDeleteItem={isDeleteItem}
                handleCloseDialog={handleCloseDialog}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                selectedItem={movie}
                onSaved={handleItemSaved}
                onAfterDelete={() => navigate(-1)}
                // sidebar props
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />
        </Box>
    )
}

export default MoviePage
