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

function CompanyPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const [company, setCompany] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [companyMovies, setCompanyMovies] = useState([])
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
        setCompanyMovies([])
        setHasMoreMovies(true)

        // Спочатку отримуємо основну інформацію про компанію
        instance
            .get(`https://api.themoviedb.org/3/company/${id}`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US"
                }
            })
            .then((res) => {
                setCompany(res.data)

                // Тепер отримуємо першу сторінку фільмів компанії
                return instance.get(`https://api.themoviedb.org/3/discover/movie`, {
                    params: {
                        api_key: API_KEY,
                        language: "en-US",
                        with_companies: id,
                        sort_by: 'popularity.desc',
                        page: 1
                    }
                })
            })
            .then((moviesRes) => {
                if (moviesRes.data && moviesRes.data.results) {
                    setCompanyMovies(moviesRes.data.results)
                    setTotalMovies(moviesRes.data.total_results)
                    setHasMoreMovies(moviesRes.data.page < moviesRes.data.total_pages)
                }
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err.response?.data?.status_message || "Failed to load company")
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
                    with_companies: id,
                    sort_by: 'popularity.desc',
                    page: nextPage
                }
            })
            .then((moviesRes) => {
                if (moviesRes.data && moviesRes.data.results) {
                    setCompanyMovies(prev => [...prev, ...moviesRes.data.results])
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
            ) : !company ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6" color="text.secondary">
                        Company not found
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
                        background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(https://image.tmdb.org/t/p/original${company.logo_path})`,
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
                            {/* Company Logo */}
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
                                {company.logo_path ? (
                                    <CardMedia
                                        component="img"
                                        image={`https://image.tmdb.org/t/p/original${company.logo_path}`}
                                        alt={company.name}
                                        sx={{
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: '100%',
                                            maxWidth: '280px',
                                            maxHeight: '180px',
                                            p: 2
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <Box sx={{
                                    display: company.logo_path ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'grey.100',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                        {company.name?.charAt(0) || 'C'}
                                    </Typography>
                                </Box>
                            </Card>

                            {/* Company Info */}
                            <Box sx={{ color: "white", flex: 1 }}>
                                <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
                                    {company.name || 'Unknown Company'}
                                </Typography>

                                {company.origin_country && (
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Country: {company.origin_country}
                                    </Typography>
                                )}

                                {company.headquarters && (
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Headquarters: {company.headquarters}
                                    </Typography>
                                )}

                                {company.homepage && (
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        <a
                                            href={company.homepage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'white', textDecoration: 'underline' }}
                                        >
                                            Official Website
                                        </a>
                                    </Typography>
                                )}

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
                                    {company.parent_company && (
                                        <Box sx={{ textAlign: "center" }}>
                                            <Typography variant="h6" sx={{ opacity: 0.8 }}>
                                                Parent: {company.parent_company.name}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Company Description */}
                    {(company.description || company.overview) && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                                About
                            </Typography>

                            <Card sx={{ p: 3, borderRadius: 2, backgroundColor: 'bg.second' }}>
                                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                    {company.description || company.overview || "No description available."}
                                </Typography>
                            </Card>
                        </Box>
                    )}

                    {/* Movies Section */}
                    {companyMovies && companyMovies.length > 0 && (
                        <Card sx={{
                            borderRadius: 2,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            backgroundColor: 'bg.second'
                        }}>
                            <Typography variant="h4" color="text.main" sx={{ fontWeight: "bold" }}>
                                Movies ({companyMovies.length} of {totalMovies})
                            </Typography>

                            <Grid2 container spacing={2}>
                                {companyMovies.map((movie) => (
                                    <Grid2 item size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }} key={movie.id}>
                                        <MovieCart
                                            movie={movie}
                                            dbType="tmdb"
                                            handleOpenDialogFolder={handleOpenDialogFolder}
                                            isImage={true}
                                            isTitle={true}
                                            isDate={true}
                                            isRating={true}
                                            isDescription={true}
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
                                ) : hasMoreMovies && companyMovies.length > 0 ? (
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

export default CompanyPage
