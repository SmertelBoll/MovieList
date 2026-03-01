import { Box, Typography, CircularProgress, Grid2, Card, CardMedia, CardContent } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../../redux/slices/AuthSlice'
import instance from '../../../axios'
import { alertError } from '../../../alerts'
import MovieSaveDialog from '../../../components/Movie/MovieSaveDialog'
import MovieCart from '../../../components/Movie/MovieCart'
import MainButton from '../../../components/Buttons/MainButton'

const API_KEY = process.env.REACT_APP_MOVIE_API_KEY

function GenrePage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const [genre, setGenre] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [genreMovies, setGenreMovies] = useState([])
    const [page, setPage] = useState(1)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMoreMovies, setHasMoreMovies] = useState(true)
    const [totalMovies, setTotalMovies] = useState(0)

    // Стани для діалогу додавання до папки
    const [openMovieSaveDialog, setOpenMovieSaveDialog] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)
    const [selectedMovie, setselectedMovie] = useState(null)

    useEffect(() => {
        setIsLoading(true)
        setPage(1)
        setGenreMovies([])
        setHasMoreMovies(true)

        // Спочатку отримуємо інформацію про жанр
        instance
            .get(`https://api.themoviedb.org/3/genre/movie/list`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US"
                }
            })
            .then((res) => {
                const currentGenre = res.data.genres.find(g => g.id === parseInt(id))
                setGenre(currentGenre)

                // Тепер отримуємо першу сторінку фільмів жанру
                return instance.get(`https://api.themoviedb.org/3/discover/movie`, {
                    params: {
                        api_key: API_KEY,
                        language: "en-US",
                        with_genres: id,
                        sort_by: 'popularity.desc',
                        page: 1
                    }
                })
            })
            .then((moviesRes) => {
                if (moviesRes.data && moviesRes.data.results) {
                    setGenreMovies(moviesRes.data.results)
                    setTotalMovies(moviesRes.data.total_results)
                    setHasMoreMovies(moviesRes.data.page < moviesRes.data.total_pages)
                }
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err.response?.data?.status_message || "Failed to load genre")
                setIsLoading(false)
            })
    }, [id])

    // Функція для завантаження додаткових фільмів
    const loadMoreMovies = () => {
        if (isLoadingMore || !hasMoreMovies) return

        setIsLoadingMore(true)
        const nextPage = page + 1

        instance
            .get(`https://api.themoviedb.org/3/discover/movie`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US",
                    with_genres: id,
                    sort_by: 'popularity.desc',
                    page: nextPage
                }
            })
            .then((moviesRes) => {
                if (moviesRes.data && moviesRes.data.results) {
                    setGenreMovies(prev => [...prev, ...moviesRes.data.results])
                    setPage(nextPage)
                    setHasMoreMovies(moviesRes.data.page < moviesRes.data.total_pages)
                }
                setIsLoadingMore(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err.response?.data?.status_message || "Failed to load more movies")
                setIsLoadingMore(false)
            })
    }

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
    const handleOpenDialogFolder = (movie) => {
        setselectedMovie(movie)
        setOpenMovieSaveDialog(true)
    }

    const handleCloseMovieSaveDialog = () => {
        setOpenMovieSaveDialog(false)
        setSelectedFolder(false)
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress color="primary" />
                </Box>
            ) : !genre ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6" color="text.secondary">
                        Genre not found
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Hero Section */}
                    <Box sx={{
                        position: "relative",
                        height: "400px",
                        borderRadius: 2,
                        overflow: "hidden",
                        background: `linear-gradient(135deg, primary.main 0%, primary.dark 100%)`,
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
                            {/* Genre Icon */}
                            <Card sx={{
                                width: 300,
                                height: 200,
                                flexShrink: 0,
                                boxShadow: 3,
                                borderRadius: 2,
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(135deg, primary.main 0%, primary.dark 100%)`,
                                    borderRadius: 1,
                                    p: 2
                                }}>
                                    <Typography variant="h1" color="text.dark" sx={{
                                        fontWeight: 'bold',
                                        fontSize: '4rem',
                                        lineHeight: 1,
                                        mb: 1
                                    }}>
                                        {genre.name?.charAt(0) || 'G'}
                                    </Typography>
                                    <Typography variant="h6" color="text.dark" sx={{
                                        fontWeight: 'medium',
                                        textAlign: 'center',
                                        opacity: 0.8
                                    }}>
                                        {genre.name || 'Genre'}
                                    </Typography>
                                </Box>
                            </Card>

                            {/* Genre Info */}
                            <Box sx={{ color: "white", flex: 1 }}>
                                <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
                                    {genre.name || 'Unknown Genre'}
                                </Typography>

                                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
                                    Movie Genre
                                </Typography>

                                {/* Statistics in Hero Section */}
                                <Box sx={{ mt: 3, display: "flex", gap: 4 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                            {totalMovies}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total Movies
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Movies Section */}
                    {genreMovies && genreMovies.length > 0 && (
                        <Card sx={{
                            borderRadius: 2,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            backgroundColor: 'bg.second'
                        }}>
                            <Typography variant="h4" color="text.main" sx={{ fontWeight: "bold" }}>
                                Movies ({genreMovies.length} of {totalMovies})
                            </Typography>

                            <Grid2 container spacing={2}>
                                {genreMovies.map((movie) => (
                                    <Grid2 item size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }} key={movie.id}>
                                        <MovieCart
                                            movie={movie}
                                            dbType="tmdb"
                                            handleOpenDialogFolder={handleOpenDialogFolder}
                                            isImage={true}
                                            isTitle={true}
                                            isDescription={true}
                                            isDate={true}
                                            isRating={false}
                                        />
                                    </Grid2>
                                ))}
                            </Grid2>

                            {/* Кнопка "Give more" */}
                            <Box sx={{ mb: 2 }}>
                                {isLoadingMore ? (
                                    <Box width="100%" textAlign="center">
                                        <CircularProgress color="primary" />
                                    </Box>
                                ) : hasMoreMovies && genreMovies.length > 0 ? (
                                    <Box display="flex" justifyContent="center">
                                        <MainButton onClick={loadMoreMovies}>Give more</MainButton>
                                    </Box>
                                ) : null}
                            </Box>
                        </Card>
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
                        selectedMovie={selectedMovie}
                    />
                </>
            )}
        </Box>
    )
}

export default GenrePage
