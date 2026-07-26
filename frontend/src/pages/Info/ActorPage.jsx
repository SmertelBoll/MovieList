import { Box, Typography, CircularProgress, Card, CardMedia } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'
import {
    heroSectionSx, heroInnerSx, heroPortraitSx, heroMediaSx,
    heroInfoSx, heroTitleSx, heroSubtitleSx, heroStatsSx, heroStatValueSx
} from './heroStyles'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const IMAGE_BASE_URL_ORIGINAL = `${process.env.REACT_APP_TMDB_IMG}/original`; // базовий URL для отримання зображень
const IMAGE_BASE_URL_W500 = `${process.env.REACT_APP_TMDB_IMG}/w500`;         // базовий URL для отримання зображень
const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

function ActorPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB } = useSelector((state) => state.config);

    // Дані про актора
    const [actor, setActor] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Дані про папки користувача
    const [folders, setFolders] = useState([])                  // Папки
    const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос


    // Загрузка даних про актора
    useEffect(() => {
        setIsLoading(true)

        instance
            .get(`${process.env.REACT_APP_URL_TMDB}/person/${id}`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US",
                    append_to_response: "combined_credits"
                }
            })
            .then((res) => {
                setActor(res.data)
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err, "Failed to load actor")
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

    // Масив фільмів, де актор грав
    const actingCredits = actor?.combined_credits?.cast || []
    const uniqueActingCredits = Object.values(
        actingCredits.reduce((acc, item) => {
            const key = `${item.media_type}_${item.id}`;
            if (!acc[key]) acc[key] = item;
            return acc;
        }, {})
    ).filter(item => typeTMDB.includes(item.media_type));

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress color="primary" />
                </Box>
            ) : !actor ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6" color="text.secondary">
                        Actor not found
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Hero Section */}
                    <Box sx={{
                        ...heroSectionSx,
                        // Саме backgroundImage, а не background: скорочений запис скинув би
                        // backgroundSize/Position із heroSectionSx і фон з'їхав би в кут
                        backgroundImage: [
                            "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7))",
                            actor.profile_path && `url(${IMAGE_BASE_URL_ORIGINAL}${actor.profile_path})`,
                        ].filter(Boolean).join(", "),
                    }}>
                        <Box sx={heroInnerSx}>
                            {/* Profile Photo */}
                            <Card sx={heroPortraitSx}>
                                <CardMedia
                                    component="img"
                                    image={actor.profile_path
                                        ? `${IMAGE_BASE_URL_W500}${actor.profile_path}`
                                        : IMAGE_DEFAULT
                                    }
                                    sx={heroMediaSx}
                                />
                            </Card>

                            {/* Actor Info */}
                            <Box sx={{ color: "white", ...heroInfoSx }}>
                                <Typography variant="h3" sx={heroTitleSx}>
                                    {actor.name}
                                </Typography>

                                {actor.birthday && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Born: {new Date(actor.birthday).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                )}

                                {actor.place_of_birth && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        {actor.place_of_birth}
                                    </Typography>
                                )}

                                {actor.deathday && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Died: {new Date(actor.deathday).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                )}

                                {actor.known_for_department && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Known for: {actor.known_for_department}
                                    </Typography>
                                )}

                                {/* Statistics in Hero Section */}
                                <Box sx={heroStatsSx}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={heroStatValueSx}>
                                            {uniqueActingCredits.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={heroStatValueSx}>
                                            {Math.round(actor.popularity)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Popularity
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Personal Info Section */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <Card sx={{
                            borderRadius: 2,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            backgroundColor: 'bg.second'
                        }}>
                            <Typography variant="h4" color="text.main" sx={{ fontWeight: "bold" }}>
                                Biography
                            </Typography>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                {actor.biography || "No biography available."}
                            </Typography>
                        </Card>
                    </Box>

                    {/* Filmography Section */}
                    <GeneralItemList
                        // Бокова панель
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        // Робота з базами даних
                        dbType="tmdb"
                        urlParams={false}
                        isPreperedData={true}
                        preperedData={uniqueActingCredits}
                        // Інформація сторінки
                        pageType="actor"
                        pageTitle="Filmography"
                        isSearch={true}
                        isSort={true}
                    />
                </>
            )}
        </Box>
    )
}

export default ActorPage 