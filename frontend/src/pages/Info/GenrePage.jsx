import { Box, Typography, CircularProgress, Card } from '@mui/material'
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'
import {
    heroSectionSx, heroInnerSx, heroLandscapeSx,
    heroInfoSx, heroTitleSx, heroStatsSx, heroStatValueSx
} from './heroStyles'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY

function GenrePage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB } = useSelector((state) => state.config);

    // Дані про жанр
    const [genre, setGenre] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [totalItems, setTotalItems] = useState(null)

    // Дані про папки користувача
    const [folders, setFolders] = useState([])                  // Папки
    const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос


    // Загрузка даних про жанр
    useEffect(() => {
        setIsLoading(true)

        // Спочатку отримуємо інформацію про жанр
        instance
            .get(`${process.env.REACT_APP_URL_TMDB}/genre/movie/list`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US"
                }
            })
            .then((res) => {
                const currentGenre = res.data.genres.find(g => g.id === parseInt(id))
                setGenre(currentGenre)

                // Тепер отримуємо першу сторінку фільмів по жанру
                const endpoint = `${process.env.REACT_APP_URL_TMDB}/discover`

                let params = {
                    api_key: API_KEY,
                    language: "en-US",
                    with_genres: id,
                    page: 1
                };

                Promise.all(
                    typeTMDB.map(type =>
                        instance.get(`${endpoint}/${type}`, { params })
                            .then(res => ({
                                totalResults: res.data.total_results
                            }))
                    )
                )
                    .then((responses) => {
                        setTotalItems(responses.reduce((sum, r) => sum + r.totalResults, 0))
                        setIsLoading(false)
                    })
                    .catch((err) => {
                        console.warn(err)
                        alertError(err, "Failed to load genre")
                        setIsLoading(false)
                    });
            })
    }, [id, typeTMDB])

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
                        ...heroSectionSx,
                        bgcolor: 'bg.second',
                    }}>
                        <Box sx={heroInnerSx}>
                            {/* Genre Icon */}
                            <Card sx={{
                                ...heroLandscapeSx,
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
                                    background: 'bg.second',
                                    borderRadius: 1,
                                    p: 2
                                }}>
                                    <Typography variant="h1" color="text.main" sx={{
                                        fontWeight: 'bold',
                                        fontSize: { xs: '3rem', md: '4rem' },
                                        lineHeight: 1,
                                        mb: 1
                                    }}>
                                        {genre.name?.charAt(0) || 'G'}
                                    </Typography>
                                    <Typography variant="h6" color="text.main" sx={{
                                        fontWeight: 'medium',
                                        textAlign: 'center',
                                        opacity: 0.8
                                    }}>
                                        {genre.name || 'Genre'}
                                    </Typography>
                                </Box>
                            </Card>

                            {/* Genre Info */}
                            <Box sx={{ color: "text.main", ...heroInfoSx }}>
                                <Typography variant="h3" sx={heroTitleSx}>
                                    {genre.name || 'Unknown Genre'}
                                </Typography>

                                {/* Statistics in Hero Section */}
                                <Box sx={heroStatsSx}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={heroStatValueSx}>
                                            {totalItems}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total Items
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Items Section */}
                    <GeneralItemList
                        // Бокова панель
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        // Робота з базами даних
                        dbType="tmdb"
                        urlParams={{ with_genres: id }}
                        isPreperedData={false}
                        preperedData={false}
                        // Інформація сторінки
                        pageType="genre"
                        pageTitle="Filmography"
                        isSearch={false}
                        isSort={true}
                    />
                </>
            )}
        </Box>
    )
}

export default GenrePage
