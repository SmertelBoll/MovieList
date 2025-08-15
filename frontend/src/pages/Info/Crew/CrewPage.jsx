import { Box, Typography, CircularProgress, Chip, Grid2, Card, CardMedia, CardContent } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../../redux/slices/AuthSlice'
import instance from '../../../axios'
import { alertError } from '../../../alerts'
import MovieCart from '../../../components/Movie/MovieCart'
import MovieSaveDialog from '../../../components/Movie/MovieSaveDialog'

const API_KEY = process.env.REACT_APP_MOVIE_API_KEY

function CrewPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const [crew, setCrew] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Стани для діалогу додавання до папки
    const [openMovieSaveDialog, setOpenMovieSaveDialog] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)
    const [selectedMovieId, setSelectedMovieId] = useState(null)

    useEffect(() => {
        setIsLoading(true)

        instance
            .get(`https://api.themoviedb.org/3/person/${id}`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US",
                    append_to_response: "movie_credits,images"
                }
            })
            .then((res) => {
                setCrew(res.data)
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err.response?.data?.status_message || "Failed to load crew member")
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
    const handleOpenDialogFolder = (movieId) => {
        setSelectedMovieId(movieId)
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

    if (!crew) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6" color="text.secondary">
                    Crew member not found
                </Typography>
            </Box>
        )
    }

    // Фільтруємо тільки crew ролі (без акторських ролей)
    const crewCredits = crew.movie_credits?.crew || []

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Hero Section */}
            <Box sx={{
                position: "relative",
                height: "400px",
                borderRadius: 2,
                overflow: "hidden",
                background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://image.tmdb.org/t/p/original${crew.profile_path})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <Box sx={{
                    display: "flex",
                    gap: 3,
                    alignItems: "center",
                    maxWidth: "1200px",
                    width: "100%",
                    p: 3
                }}>
                    {/* Profile Photo */}
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
                            image={`https://image.tmdb.org/t/p/w500${crew.profile_path}`}
                            alt={crew.name}
                        />
                    </Card>

                    {/* Crew Info */}
                    <Box sx={{ color: "white", flex: 1 }}>
                        <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
                            {crew.name}
                        </Typography>

                        {crew.birthday && (
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Born: {new Date(crew.birthday).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Typography>
                        )}

                        {crew.place_of_birth && (
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {crew.place_of_birth}
                            </Typography>
                        )}

                        {crew.known_for_department && (
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                Known for: {crew.known_for_department}
                            </Typography>
                        )}

                        {/* Statistics in Hero Section */}
                        <Box sx={{ mt: 3, display: "flex", gap: 4 }}>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                    {crewCredits.length}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    Total Movies
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                    {Math.round(crew.popularity)}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    Popularity
                                </Typography>
                            </Box>
                            {crew.deathday && (
                                <Box sx={{ textAlign: "center" }}>
                                    <Typography variant="h6" sx={{ opacity: 0.8 }}>
                                        Died: {new Date(crew.deathday).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Personal Info Section */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    Personal Information
                </Typography>

                <Card sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                        Biography
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {crew.biography || "No biography available."}
                    </Typography>
                </Card>
            </Box>

            {/* Filmography Section */}
            {crew.movie_credits?.crew && crew.movie_credits.crew.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                        Filmography
                    </Typography>

                    {crewCredits.length > 0 ? (
                        <Grid2 container spacing={2}>
                            {crewCredits.slice(0, 20).map((movie) => (
                                <Grid2 item size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }} key={movie.id}>
                                    <MovieCart movie={movie} handleOpenDialogFolder={handleOpenDialogFolder} />
                                </Grid2>
                            ))}
                        </Grid2>
                    ) : (
                        <Typography variant="body1" color="text.secondary">
                            No movies found for this actor.
                        </Typography>
                    )}
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
                selectedMovieId={selectedMovieId}
            />
        </Box>
    )
}

export default CrewPage 