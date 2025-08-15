import { Box, Typography, CircularProgress, Chip, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import AddIcon from '@mui/icons-material/Add'
import MovieSaveDialog from '../../components/Movie/MovieSaveDialog'
import ActorCart from '../Info/Movie/ActorCart'

const API_KEY = process.env.REACT_APP_MOVIE_API_KEY

function MoviePage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const [movie, setMovie] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Стани для діалогу додавання до папки
    const [openMovieSaveDialog, setOpenMovieSaveDialog] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    useEffect(() => {
        setIsLoading(true)

        instance
            .get(`https://api.themoviedb.org/3/movie/${id}`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US",
                    append_to_response: "credits,videos,images"
                }
            })
            .then((res) => {
                setMovie(res.data)
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err.response?.data?.status_message || "Failed to load movie")
                setIsLoading(false)
            })
    }, [id])

    // Завантаження папок користувача
    useEffect(() => {
        if (isGetFolders && isAuth) {
            instance
                .get(`/folders`)
                .then((res) => {
                    setFolders(res.data)
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err)
                })
            setIsGetFolders(false)
        }
    }, [isGetFolders, isAuth])

    // Функції для роботи з діалогом
    const handleOpenDialogFolder = () => {
        setOpenMovieSaveDialog(true)
    }

    const handleCloseMovieSaveDialog = () => {
        setOpenMovieSaveDialog(false)
        setSelectedFolder(false)
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

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Hero Section */}
            <Box sx={{
                position: "relative",
                height: "400px",
                borderRadius: 2,
                overflow: "hidden",
                background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
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
                            image={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                        />
                    </Card>

                    {/* Movie Info */}
                    <Box sx={{ color: "white", flex: 1 }}>
                        <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
                            {movie.title}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                            {movie.genres?.map((genre) => (
                                <Chip
                                    key={genre.id}
                                    label={genre.name}
                                    size="small"
                                    sx={{
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        color: "white",
                                        "&:hover": {
                                            backgroundColor: "rgba(255,255,255,0.3)"
                                        }
                                    }}
                                />
                            ))}
                        </Box>

                        <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                            {movie.overview}
                        </Typography>

                        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                ⭐ {movie.vote_average?.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {movie.release_date} • {movie.runtime} min
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Cast Section */}
            {movie.credits?.cast && movie.credits.cast.length > 0 && (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Cast
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
                        {movie.credits.cast.slice(0, 20).map((actor) => (
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
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Crew
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
                        {movie.credits.crew
                            .filter(member => ['Director', 'Producer', 'Writer', 'Screenplay'].includes(member.job))
                            .slice(0, 15)
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
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Production Companies
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {movie.production_companies.map((company) => (
                            <Chip
                                key={company.id}
                                label={company.name}
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Діалог додавання до папки */}
            <MovieSaveDialog
                open={openMovieSaveDialog}
                onClose={handleCloseMovieSaveDialog}
                folders={folders}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
                selectedMovieId={parseInt(id)}
            />
        </Box>
    )
}

export default MoviePage 