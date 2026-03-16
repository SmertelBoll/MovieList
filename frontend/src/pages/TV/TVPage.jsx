import { Box, Typography, CircularProgress, Chip, Grid, Card, CardMedia, CardContent, IconButton, Divider } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import AddIcon from '@mui/icons-material/Add'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import ActorCart from '../../components/Carts/ActorCart'
import EpisodeCart from '../../components/Carts/EpisodeCart'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const IMAGE_BASE_URL_ORIGINAL = `${process.env.REACT_APP_TMDB_IMG}/original`;
const IMAGE_BASE_URL_W500 = `${process.env.REACT_APP_TMDB_IMG}/w500`;
const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

function TVPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const [serial, setSerial] = useState(null)
    const [seasonDetails, setSeasonDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true)

    // Стани для діалогу додавання до папки
    const [isOpenDialogAdd, setIsOpenDialogAdd] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    const [itemFolders, setItemFolders] = useState([]) // Папки, де є цей фільм
    const [isLoadingItemFolders, setIsLoadingItemFolders] = useState(true) // Завантаження папок, де є цей фільм

    const navigate = useNavigate()

    useEffect(() => {
        setIsLoading(true)

        instance
            .get(`${process.env.REACT_APP_URL_TMDB}/tv/${id}`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US",
                    append_to_response: "credits"
                }
            })
            .then((res) => {
                setSerial({ ...res.data, media_type: "tv" })

                // Fetch details for all seasons to get episode ratings
                const seasonPromises = res.data.seasons
                    .filter(s => s.season_number > 0)
                    .map(s =>
                        instance.get(
                            `${process.env.REACT_APP_URL_TMDB}/tv/${id}/season/${s.season_number}`,
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
                        console.log(seasonMap)
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
    }, [id])

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
        if (isAuth && id) {
            setIsLoadingItemFolders(true)
            instance
                .get(`/folders/movie/${id}`)
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
    }, [id, isAuth, isGetFolders])

    // Функції для роботи з діалогом
    const handleOpenDialogFolder = () => {
        setIsOpenDialogAdd(true)
    }
    const handleCloseDialog = () => {
        setIsOpenDialogAdd(false)
        setSelectedFolder(false)
    }

    // Функція для отримання кольору за оцінкою
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

    const seasonNumbers = Object.keys(seasonDetails).sort((a, b) => a - b);
    const maxEpisodes = Math.max(...Object.values(seasonDetails).map(epMap =>
        Math.max(...Object.keys(epMap).map(Number), 0)
    ), 0);

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
                {/* Кнопка Add для авторизованих користувачів */}
                {isAuth && (
                    <IconButton
                        aria-label="add to folder"
                        onClick={handleOpenDialogFolder}
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
                                '& svg': {
                                    color: "text.dark",
                                },
                            }
                        }}
                    >
                        <AddIcon sx={{
                            opacity: 1,
                            color: "text.main"
                        }} />
                    </IconButton>
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
                    <Card sx={{
                        width: 200,
                        height: 300,
                        flexShrink: 0,
                        boxShadow: 3,
                        borderRadius: 2
                    }}>
                        <CardMedia
                            component="img"
                            height="300"
                            image={serial.poster_path
                                ? `${IMAGE_BASE_URL_W500}${serial.poster_path}`
                                : IMAGE_DEFAULT
                            }
                        />
                    </Card>

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
                                            onClick={() => navigate(`/user/folders/${folder.name}?filter=${encodeURIComponent(serial.name)}`)}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: "rgba(255,255,255,0.05)",
                                                color: "white",
                                                borderColor: "rgba(255,255,255,0.2)",
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

            {/* Ratings Heatmap Section */}
            <Box>
                <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>Episode Ratings</Typography>

                <Box sx={{ overflowX: "auto", pb: 2 }}>
                    <Legend />
                    <Box sx={{ minWidth: "fit-content", display: "flex", flexDirection: "column", gap: 1 }}>
                        {/* Column Headers (Episodes) */}
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <EpisodeCart
                                unique_key={'A1'}
                                backgroundColor={getRatingColor()}
                                textColor={getTextColor()}
                                isHoverActive={false}
                            />
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

                        {/* Rows (Seasons) */}
                        {seasonNumbers.map((sNum) => (
                            <Box key={sNum} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <EpisodeCart
                                    unique_key={sNum}
                                    backgroundColor={getRatingColor()}
                                    textColor={getTextColor()}
                                    isHoverActive={false}
                                >
                                    S{sNum}
                                </EpisodeCart>
                                {/* <Box sx={{ width: 35, height: 35, flexShrink: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>S{sNum}</Typography>
                                </Box> */}
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    {Array.from({ length: maxEpisodes }, (_, i) => {
                                        const eNum = i + 1;
                                        const episode = seasonDetails[sNum][eNum];

                                        return <EpisodeCart
                                            unique_key={`${sNum}_${eNum}`}
                                            backgroundColor={getRatingColor(episode?.vote_average)}
                                            textColor={getTextColor(episode?.vote_average)}
                                            isHoverActive={episode}
                                        >
                                            {episode?.vote_average.toFixed(1)}
                                        </EpisodeCart>
                                    })}
                                </Box>
                            </Box>
                        ))}
                    </Box>
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

            <ItemSaveDialog
                isOpenDialogAdd={isOpenDialogAdd}
                handleCloseDialog={handleCloseDialog}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                selectedItem={serial}
                // sidebar props
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />
        </Box>
    )
}

export default TVPage;
