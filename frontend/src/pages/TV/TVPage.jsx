import { Box, Typography, CircularProgress, Chip, Card, CardMedia, IconButton, Rating, Tooltip, Menu, MenuItem } from '@mui/material'
import { useEffect, useState, useMemo, useCallback, useRef, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError, alertSuccess } from '../../alerts'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import SeasonEpisodeDialog from '../../components/SeasonEpisodeDialog/SeasonEpisodeDialog'
import ActorCart from '../../components/Carts/ActorCart'
import EpisodeCart from '../../components/Carts/EpisodeCart'
import DropdownMenu from '../../components/_customMUI/DropdownMenu'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const IMAGE_BASE_URL_ORIGINAL = `${process.env.REACT_APP_TMDB_IMG}/original`;
const IMAGE_BASE_URL_W500 = `${process.env.REACT_APP_TMDB_IMG}/w500`;
const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

// Мемоїзована клітинка серії. Перемальовується ЛИШЕ коли змінюються її власні
// (примітивні) пропси, тому збереження однієї серії не чіпає решту сотень клітинок.
// Важливо: onClick має бути стабільним (useCallback), а content/kind — примітивами.
const EpisodeCell = memo(function EpisodeCell({ sNum, eNum, bg, text, kind, content, active, onClick }) {
    let node = content
    if (kind === 'empty') node = <CheckBoxOutlineBlankIcon sx={{ fontSize: 20, color: "text.dark" }} />
    else if (kind === 'checked') node = <CheckBoxIcon sx={{ fontSize: 20, color: "text.dark" }} />

    return (
        <EpisodeCart
            unique_key={`${sNum}_${eNum}`}
            backgroundColor={bg}
            textColor={text}
            isHoverActive={active}
            onClick={active && onClick ? (e) => onClick(e, sNum, eNum) : undefined}
        >
            {node}
        </EpisodeCart>
    )
})

function TVPage({ isSaved = false }) {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const [serial, setSerial] = useState(null)
    const [seasonDetails, setSeasonDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true)

    // Завжди актуальне посилання на serial для стабільних колбеків (без перестворення)
    const serialRef = useRef(serial)
    useEffect(() => { serialRef.current = serial }, [serial])

    // Папка, у якій збережено цей серіал (тільки для збереженого серіалу)
    const [currentFolderName, setCurrentFolderName] = useState(null)
    const [reload, setReload] = useState(0)

    // Стани для діалогу
    const [isOpenDialogAdd, setIsOpenDialogAdd] = useState(false)
    const [isOpenDialogEdit, setIsOpenDialogEdit] = useState(false)
    const [isDeleteItem, setIsDeleteItem] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    const [itemFolders, setItemFolders] = useState([]) // Папки, де є цей серіал
    const [isLoadingItemFolders, setIsLoadingItemFolders] = useState(true) // Завантаження папок, де є цей серіал

    const navigate = useNavigate()

    // Завантаження даних серіалу з TMDB (за потреби — спочатку дані зі збереженого документа mongo)
    useEffect(() => {
        setIsLoading(true)

        const loadTmdb = (tmdbId, savedFields = {}) => {
            instance
                .get(`${process.env.REACT_APP_URL_TMDB}/tv/${tmdbId}`, {
                    params: {
                        api_key: API_KEY,
                        language: "en-US",
                        append_to_response: "credits"
                    }
                })
                .then((res) => {
                    setSerial({ ...res.data, media_type: "tv", tmdbId: res.data.id, ...savedFields })

                    // Завантажуємо деталі всіх сезонів, щоб отримати оцінки серій
                    const seasonPromises = res.data.seasons
                        .filter(s => s.season_number > 0)
                        .map(s =>
                            instance.get(
                                `${process.env.REACT_APP_URL_TMDB}/tv/${tmdbId}/season/${s.season_number}`,
                                { params: { api_key: API_KEY, language: "en-US" } }
                            )
                        );

                    Promise.all(seasonPromises)
                        .then(responses => {
                            const seasonMap = {};
                            responses.forEach(r => {
                                const season = r.data;
                                const episodeMap = {};
                                season.episodes.forEach(e => {
                                    episodeMap[e.episode_number] = e;
                                });
                                seasonMap[season.season_number] = episodeMap;
                            });
                            setSeasonDetails(seasonMap);
                            setIsLoading(false);
                        })
                        .catch(err => {
                            console.warn(err);
                            alertError(err, "Failed to fetch seasons")
                            setIsLoading(false);
                        });
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err, "Failed to load TV show")
                    setIsLoading(false)
                })
        }

        if (isSaved) {
            instance
                .get(`/tv/mongo/${id}`)
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
                        customType: saved.customType,
                        seasons: saved.seasons
                    })
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err, "Failed to load TV show")
                    setIsLoading(false)
                })
        } else {
            loadTmdb(id)
        }
    }, [id, isSaved, reload])

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

    // Завантаження папок, де є цей серіал
    useEffect(() => {
        const tmdbId = serial?.tmdbId
        if (isAuth && tmdbId) {
            setIsLoadingItemFolders(true)
            instance
                .get(`/folders/tv/${tmdbId}`)
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
    }, [serial?.tmdbId, isAuth, isGetFolders])

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
        // Оновлюємо дані сторінки після редагування / додавання
        if (isSaved) setReload(prev => prev + 1)
    }

    const savedMenuItems = [
        { key: 'Add', label: 'Add', onClick: handleOpenDialogAdd },
        { key: 'Edit', label: 'Edit', onClick: handleOpenDialogEdit },
        { key: 'Delete', label: 'Delete', onClick: handleDeleteItem },
    ]

    // -- Оцінка сезонів / серій (тільки для збереженого серіалу) -- //
    const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
    const [ratingMode, setRatingMode] = useState("season")
    const [ratingTarget, setRatingTarget] = useState({ season: null, episode: null })
    const [ratingInitial, setRatingInitial] = useState({})

    const findMongoSeason = (sNum) => serial?.seasons?.find(s => s.season === Number(sNum))
    const findMongoEpisode = (sNum, eNum) => findMongoSeason(sNum)?.episodes?.find(e => e.episode === Number(eNum))

    // Швидкі O(1) карти для рендеру таблиці (перераховуються лише коли змінюються дані)
    // Ключ "season_episode" -> mongo-серія
    const mongoEpisodeMap = useMemo(() => {
        const map = {}
        serial?.seasons?.forEach(s => {
            s.episodes?.forEach(e => { map[`${s.season}_${e.episode}`] = e })
        })
        return map
    }, [serial?.seasons])

    // Зсув кожного сезону (перша серія -> перша колонка) — рахуємо один раз
    const seasonOffsets = useMemo(() => {
        const offsets = {}
        Object.keys(seasonDetails).forEach(sNum => {
            const nums = Object.keys(seasonDetails[sNum] || {}).map(Number).sort((a, b) => a - b)
            offsets[sNum] = nums.length ? nums[0] - 1 : 0
        })
        return offsets
    }, [seasonDetails])

    const openSeasonDialog = (sNum) => {
        const s = findMongoSeason(sNum)
        setRatingMode("season")
        setRatingTarget({ season: Number(sNum), episode: null })
        setRatingInitial({ rating: s?.rating, comment: s?.comment, dateAdded: s?.dateAdded })
        setRatingDialogOpen(true)
    }
    const openEpisodeDialog = (sNum, eNum) => {
        const ep = findMongoEpisode(sNum, eNum)
        setRatingMode("episode")
        setRatingTarget({ season: Number(sNum), episode: Number(eNum) })
        setRatingInitial({ rating: ep?.rating, comment: ep?.comment, dateAdded: ep?.dateAdded, watchedCount: ep?.watchedCount })
        setRatingDialogOpen(true)
    }
    const handleSaveRating = (values) => {
        const { season, episode } = ratingTarget
        const url = ratingMode === "episode"
            ? `/tv/${serial._id}/season/${season}/episode/${episode}`
            : `/tv/${serial._id}/season/${season}`

        instance
            .patch(url, values)
            .then((res) => {
                alertSuccess(ratingMode === "episode" ? "Episode saved" : "Season saved")
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
                setRatingDialogOpen(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    // -- Кількість переглянутих серій у сезоні + "переглянути всі" -- //
    const getSeasonWatchedCount = (sNum) => {
        const total = Object.keys(seasonDetails[sNum] || {}).length
        const seasonDoc = findMongoSeason(sNum)
        const watched = seasonDoc?.episodes?.filter(e => (e.watchedCount ?? 0) > 0).length ?? 0
        return { watched, total }
    }

    const handleMarkSeasonWatched = (sNum) => {
        const epNums = Object.keys(seasonDetails[sNum] || {}).map(Number)
        instance
            .patch(`/tv/${serial._id}/season/${sNum}/watched`, { episodes: epNums })
            .then((res) => {
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    // -- Дії над серією -- //
    // Повне видалення серії з бази
    const handleDeleteEpisode = (sNum, eNum) => {
        instance
            .delete(`/tv/${serial._id}/season/${sNum}/episode/${eNum}`)
            .then((res) => {
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    // Одне спільне меню Edit/Delete для всіх серій (швидше за DropdownMenu на кожну клітинку)
    const [episodeMenuAnchor, setEpisodeMenuAnchor] = useState(null)
    const [episodeMenuTarget, setEpisodeMenuTarget] = useState({ season: null, episode: null })

    // Стабільний колбек (не перестворюється при зміні serial) -> EpisodeCell не ре-рендериться через нього.
    // serial читаємо з ref, тому залежностей немає.
    const handleEpisodeCellClick = useCallback((e, sNum, eNum) => {
        const current = serialRef.current
        const season = current?.seasons?.find(s => s.season === Number(sNum))
        const ep = season?.episodes?.find(item => item.episode === Number(eNum))
        const isEpisodeSaved = Boolean(ep && (ep.watchedCount ?? 0) > 0)

        if (isEpisodeSaved) {
            // Серія вже переглянута -> відкриваємо меню Edit/Delete
            setEpisodeMenuAnchor(e.currentTarget)
            setEpisodeMenuTarget({ season: sNum, episode: eNum })
        } else {
            // Серія без переглядів (0) -> тихо ставимо 1 перегляд
            instance
                .patch(`/tv/${current._id}/season/${sNum}/episode/${eNum}`, {
                    watchedCount: 1,
                    dateAdded: new Date(),
                    rating: ep?.rating ?? null,
                    comment: ep?.comment ?? ""
                })
                .then((res) => {
                    setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err)
                })
        }
    }, [])
    const closeEpisodeMenu = () => setEpisodeMenuAnchor(null)


    // Функція для отримання кольору за оцінкою (шкала 0-10)
    const getRatingColor = (rating) => {
        if (!rating || rating === 0) return "rgba(255,255,255,0.0)";
        if (rating >= 9) return "#1b5e20"; // Awesome
        if (rating >= 8) return "#4caf50"; // Great
        if (rating >= 7) return "#fbc02d"; // Good
        if (rating >= 6) return "#ff9800"; // Regular
        if (rating >= 5) return "#f44336"; // Bad
        return "#9c27b0"; // Garbage (< 5)
    };
    const getTextColor = (rating) => {
        if (!rating || rating === 0) return "black";
        if (rating >= 7.0 && rating < 8.0) return "black"; // Dark text for yellow
        return "white";
    };

    // Вигляд клітинки оцінки сезону (mongo). Прямокутник із "rating/100"
    const getSeasonCell = (sNum) => {
        const season = findMongoSeason(sNum);
        const rating = season?.rating ? season.rating : null; // 0-100
        if (rating == null) {
            return { bg: "#ffffff", text: "black", content: "-" };
        }
        return { bg: getRatingColor(rating / 10), text: getTextColor(rating / 10), content: `${rating}` };
    };

    // Стан клітинки серії у вигляді ПРИМІТИВІВ (для React.memo).
    // kind: 'none' | 'empty' | 'checked' | 'rating' | 'dash'
    //  - 'empty'/'checked' -> EpisodeCell сам рендерить іконку (щоб не передавати JSX як проп)
    const getEpisodeCellState = (sNum, eNum) => {
        const exists = Boolean(seasonDetails[sNum]?.[eNum]);
        if (!exists) {
            return { bg: "rgba(255,255,255,0.0)", text: "black", kind: "none", content: "", active: false };
        }

        if (isSaved) {
            // mongo: не переглянуто -> порожній чекбокс (навіть якщо є оцінка);
            // переглянуто з оцінкою -> число; переглянуто без оцінки -> галочка
            const ep = mongoEpisodeMap[`${sNum}_${eNum}`];
            const watched = ep?.watchedCount > 0;
            if (!watched) {
                return { bg: "#ffffff", text: "black", kind: "empty", content: "", active: true };
            }
            const rating = ep?.rating ? ep.rating / 10 : null;
            if (rating != null) {
                return { bg: getRatingColor(rating), text: getTextColor(rating), kind: "rating", content: rating.toFixed(1), active: true };
            }
            return { bg: "#ffffff", text: "black", kind: "checked", content: "", active: true };
        }

        // TMDB: оцінка -> число; без оцінки -> білий квадрат
        const episode = seasonDetails[sNum]?.[eNum];
        const rating = episode?.vote_average ? episode.vote_average : null;
        if (rating == null) {
            return { bg: "#ffffff", text: "black", kind: "dash", content: "-", active: true };
        }
        return { bg: getRatingColor(rating), text: getTextColor(rating), kind: "rating", content: rating.toFixed(1), active: true };
    };

    // Зсув сезону: якщо нумерація серій не починається з 1 (напр. перша серія 65),
    // зсуваємо серії так, щоб перша серія опинилась у першій колонці
    const getSeasonOffset = (sNum) => seasonOffsets[sNum] ?? 0;

    // Тултіп для серії (TMDB): номер серії, кількість голосів, дата виходу
    const getEpisodeTooltip = (sNum, eNum) => {
        const ep = seasonDetails[sNum]?.[eNum];
        if (!ep) return "";
        return (
            <Box sx={{ p: 0.5 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: "bold" }}>
                    Episode {ep.episode_number}
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                    Votes: {ep.vote_count ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                    Air date: {ep.air_date || "—"}
                </Typography>
            </Box>
        );
    };

    const seasonNumbers = useMemo(
        () => Object.keys(seasonDetails).sort((a, b) => a - b),
        [seasonDetails]
    );
    // Кількість колонок з урахуванням зсуву кожного сезону
    const maxEpisodes = useMemo(
        () => Math.max(
            ...seasonNumbers.map(sNum => {
                const nums = Object.keys(seasonDetails[sNum] || {}).map(Number).sort((a, b) => a - b);
                if (nums.length === 0) return 0;
                return nums[nums.length - 1] - (nums[0] - 1);
            }),
            0
        ),
        [seasonNumbers, seasonDetails]
    );

    // Legend Component
    const Legend = () => (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3, justifyContent: "center" }}>
            {[
                { label: "Awesome", color: "#1b5e20" },
                { label: "Great", color: "#4caf50" },
                { label: "Good", color: "#fbc02d", textColor: "black" },
                { label: "Regular", color: "#ff9800" },
                { label: "Bad", color: "#f44336" },
                { label: "Garbage", color: "#9c27b0" },
            ].map((item) => (
                <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: "4px", backgroundColor: item.color }} />
                    <Typography variant="caption" sx={{ fontWeight: "bold", opacity: 0.8 }}>{item.label}</Typography>
                </Box>
            ))}
        </Box>
    );

    // Таблиця серій. Мемоїзуємо, щоб зміна стану меню/діалогів НЕ перемальовувала сотні клітинок.
    // Перераховується лише коли реально змінюються дані (seasonDetails / serial.seasons / isSaved).
    const heatmapGrid = useMemo(() => (
        <Box sx={{ minWidth: "fit-content", display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Column Headers (Episodes) */}
            <Box sx={{ display: "flex", gap: 1 }}>
                <EpisodeCart
                    unique_key={'A1'}
                    backgroundColor={getRatingColor()}
                    textColor={getTextColor()}
                    isHoverActive={false}
                />
                {isSaved && (
                    <EpisodeCart
                        unique_key={'A_watched'}
                        width={60}
                        backgroundColor={getRatingColor()}
                        textColor={getTextColor()}
                        isHoverActive={false}
                    >
                        Seen
                    </EpisodeCart>
                )}
                {isSaved && (
                    <EpisodeCart
                        unique_key={'A_season'}
                        width={80}
                        backgroundColor={getRatingColor()}
                        textColor={getTextColor()}
                        isHoverActive={false}
                    >
                        Rate
                    </EpisodeCart>
                )}
                <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                    {Array.from({ length: maxEpisodes }, (_, i) => (
                        <EpisodeCart
                            unique_key={i}
                            backgroundColor={getRatingColor()}
                            textColor={getTextColor()}
                            isHoverActive={false}
                        >
                            E{i + 1}
                        </EpisodeCart>
                    ))}
                </Box>
            </Box>

            {/* Rows (Seasons) */}
            {seasonNumbers.map((sNum) => {
                const seasonCell = getSeasonCell(sNum);
                return (
                    <Box key={sNum} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EpisodeCart
                            unique_key={sNum}
                            backgroundColor={getRatingColor()}
                            textColor={getTextColor()}
                            isHoverActive={isSaved}
                            onClick={isSaved ? () => openSeasonDialog(sNum) : undefined}
                        >
                            S{sNum}
                        </EpisodeCart>
                        {isSaved && (() => {
                            const wc = getSeasonWatchedCount(sNum);
                            return (
                                <DropdownMenu
                                    width={180}
                                    items={[
                                        { key: 'all', label: 'Mark all as watched', onClick: () => handleMarkSeasonWatched(sNum) },
                                    ]}
                                    renderTrigger={({ onClick }) => (
                                        <EpisodeCart
                                            unique_key={`${sNum}_watched`}
                                            width={60}
                                            backgroundColor={"#ffffff"}
                                            textColor={"black"}
                                            isHoverActive={true}
                                            onClick={onClick}
                                        >
                                            {`${wc.watched}/${wc.total}`}
                                        </EpisodeCart>
                                    )}
                                />
                            );
                        })()}
                        {isSaved && (
                            <EpisodeCart
                                unique_key={`${sNum}_season`}
                                width={80}
                                backgroundColor={seasonCell.bg}
                                textColor={seasonCell.text}
                                isHoverActive={true}
                                onClick={() => openSeasonDialog(sNum)}
                            >
                                {seasonCell.content}
                            </EpisodeCart>
                        )}
                        <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                            {Array.from({ length: maxEpisodes }, (_, i) => {
                                const eNum = i + 1 + getSeasonOffset(sNum);
                                const cell = getEpisodeCellState(sNum, eNum);

                                if (isSaved) {
                                    // Мемоїзована клітинка зі стабільним onClick -> ре-рендериться лише вона сама
                                    return (
                                        <EpisodeCell
                                            key={`${sNum}_${eNum}`}
                                            sNum={sNum}
                                            eNum={eNum}
                                            bg={cell.bg}
                                            text={cell.text}
                                            kind={cell.kind}
                                            content={cell.content}
                                            active={cell.active}
                                            onClick={handleEpisodeCellClick}
                                        />
                                    );
                                }

                                const episodeCart = (
                                    <EpisodeCell
                                        sNum={sNum}
                                        eNum={eNum}
                                        bg={cell.bg}
                                        text={cell.text}
                                        kind={cell.kind}
                                        content={cell.content}
                                        active={cell.active}
                                    />
                                );

                                // На сторінці TMDB показуємо тултіп з інфою про серію
                                if (!isSaved && cell.active) {
                                    return (
                                        <Tooltip key={`${sNum}_${eNum}`} title={getEpisodeTooltip(sNum, eNum)} arrow>
                                            <Box component="span" sx={{ display: "inline-flex" }}>
                                                {episodeCart}
                                            </Box>
                                        </Tooltip>
                                    );
                                }

                                return <Box key={`${sNum}_${eNum}`} component="span" sx={{ display: "inline-flex" }}>{episodeCart}</Box>
                            })}
                        </Box>
                    </Box>
                );
            })}
        </Box>
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [seasonDetails, serial?.seasons, isSaved, maxEpisodes, seasonNumbers, mongoEpisodeMap, seasonOffsets]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress color="primary" />
            </Box>
        )
    }

    if (!serial) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6" color="text.secondary">
                    TV Show not found
                </Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Hero Section */}
            <Box sx={{
                position: "relative",
                height: "400px",
                borderRadius: 2,
                overflow: "hidden",
                background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${IMAGE_BASE_URL_ORIGINAL}${serial.backdrop_path})`,
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
                                        aria-label="edit saved tv"
                                        onClick={onClick}
                                        sx={{
                                            position: "absolute",
                                            right: 20,
                                            top: 20,
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
                                    right: 20,
                                    top: 20,
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
                    gap: 3,
                    alignItems: "center",
                    maxWidth: "1200px",
                    width: "100%",
                    p: 3
                }}>
                    {/* Poster */}
                    <Tooltip title={isSaved ? "Open the TV page" : ""} arrow placement="top">
                        <Card
                            onClick={isSaved ? () => navigate(`/tv/${serial.tmdbId}`) : undefined}
                            sx={{
                                width: 200,
                                height: 300,
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
                                height="300"
                                image={serial.poster_path
                                    ? `${IMAGE_BASE_URL_W500}${serial.poster_path}`
                                    : IMAGE_DEFAULT
                                }
                            />
                        </Card>
                    </Tooltip>

                    {/* Serial Info */}
                    <Box sx={{ color: "white", flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* Title */}
                        <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                            {serial.name}
                        </Typography>

                        {/* Genres */}
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {serial.genres?.map((genre) => (
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

                        {/* Overview */}
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {serial.overview}
                        </Typography>

                        {/* Rating and Release Date */}
                        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                ⭐ {serial.vote_average?.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {serial.first_air_date} • {serial.number_of_seasons} Seasons • {serial.number_of_episodes} Episodes
                            </Typography>
                        </Box>

                        {/* Block with saved folders */}
                        {isAuth && !isLoadingItemFolders && itemFolders.length > 0 && (
                            <Box>
                                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                                    <Typography variant="body1">
                                        Saved in:
                                    </Typography>
                                    {itemFolders.map((folder) => (
                                        <Chip
                                            key={folder.name}
                                            label={folder.name}
                                            variant="outlined"
                                            onClick={() => navigate(`/folders/${folder.name}?filter=${encodeURIComponent(serial.name)}`)}
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

            {/* User review (тільки для збереженого серіалу) */}
            {isSaved && (
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
                    {/* Коментар (займає всю решту місця) */}
                    <Box bgcolor="bg.second" sx={{ flex: 1, minWidth: 0, borderRadius: 2, p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography variant="h5" color="text.main">My review</Typography>
                        <Typography variant="body1" color="text.main" sx={{ whiteSpace: "pre-wrap" }}>
                            {serial.comment || "No comment"}
                        </Typography>
                    </Box>

                    {/* Оцінка та дати (під розмір вмісту) */}
                    <Box bgcolor="bg.second" sx={{ flex: "0 0 auto", borderRadius: 2, p: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Rating
                                name="user-rating"
                                value={(serial.rating || 0) / 20}
                                precision={0.1}
                                readOnly
                            />
                            <Typography variant="h6" color="text.main" sx={{ whiteSpace: "nowrap" }}>
                                {serial.rating ?? "-"}/100
                            </Typography>
                        </Box>
                        {serial.dateAdded && (
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                Added: {serial.dateAdded.split('T')[0]}
                            </Typography>
                        )}
                        {serial.updatedAt && (
                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                Updated: {serial.updatedAt.split('T')[0]}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}

            {/* Ratings Heatmap Section */}
            <Box>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>Episode Ratings</Typography>

                <Box sx={{ overflowX: "auto", pb: 2, px: 1 }}>
                    <Legend />
                    {heatmapGrid}
                </Box>
            </Box>

            {/* Top Cast Section */}
            {serial.credits?.cast && serial.credits.cast.length > 0 && (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Top Cast
                    </Typography>
                    <Box sx={{
                        display: "flex",
                        gap: 2,
                        overflowX: "auto",
                        pb: 2,
                        "&::-webkit-scrollbar": {
                            height: 8,
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
                    }}>
                        {serial.credits.cast.map((actor) => (
                            <ActorCart
                                key={actor.id}
                                person={actor}
                                role={actor.character}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Top Crew Section */}
            {serial.credits.crew && serial.credits.crew.length > 0 && (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Top Crew
                    </Typography>
                    <Box sx={{
                        display: "flex",
                        gap: 2,
                        overflowX: "auto",
                        pb: 2,
                        "&::-webkit-scrollbar": {
                            height: 8,
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
                    }}>
                        {serial.credits.crew
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

            {/* Діалог додавання / редагування / видалення */}
            <ItemSaveDialog
                isOpenDialogAdd={isOpenDialogAdd}
                isOpenDialogEdit={isOpenDialogEdit}
                isDeleteItem={isDeleteItem}
                handleCloseDialog={handleCloseDialog}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                selectedItem={serial}
                onAfterDelete={() => navigate(-1)}
                // sidebar props
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />

            {/* Діалог оцінки сезону / серії */}
            <SeasonEpisodeDialog
                open={ratingDialogOpen}
                mode={ratingMode}
                title={ratingMode === "episode"
                    ? `S${ratingTarget.season} · E${ratingTarget.episode}`
                    : `Season ${ratingTarget.season}`}
                initial={ratingInitial}
                onClose={() => setRatingDialogOpen(false)}
                onSave={handleSaveRating}
            />

            {/* Спільне меню Edit/Delete для серій */}
            <Menu
                anchorEl={episodeMenuAnchor}
                open={Boolean(episodeMenuAnchor)}
                onClose={closeEpisodeMenu}
                disableScrollLock
                slotProps={{
                    paper: {
                        sx: {
                            width: 140,
                            borderRadius: 2,
                            boxShadow: 4,
                            bgcolor: 'bg.second',
                            color: 'text.main',
                            '& .MuiList-root': { p: 0 },
                        },
                    },
                }}
            >
                {[
                    { key: 'edit', label: 'Edit', onClick: () => openEpisodeDialog(episodeMenuTarget.season, episodeMenuTarget.episode) },
                    { key: 'delete', label: 'Delete', onClick: () => handleDeleteEpisode(episodeMenuTarget.season, episodeMenuTarget.episode) },
                ].map((item) => (
                    <MenuItem
                        key={item.key}
                        onClick={() => { item.onClick(); closeEpisodeMenu(); }}
                        sx={{
                            py: 1,
                            px: 2,
                            '&:hover': { bgcolor: 'yellow.main', color: 'text.dark' },
                        }}
                    >
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    )
}

export default TVPage;
