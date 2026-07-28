import { Box, Typography, CircularProgress, Chip, Grid2, Card, CardMedia, CardContent } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'
import { getTmdbLanguage } from '../../utils/languages'
import {
    heroSectionSx, heroInnerSx, heroPortraitSx, heroMediaSx,
    heroInfoSx, heroTitleSx, heroSubtitleSx, heroStatsSx, heroStatValueSx
} from './heroStyles'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const IMAGE_BASE_URL_ORIGINAL = `${process.env.REACT_APP_TMDB_IMG}/original`; // базовий URL для отримання зображень
const IMAGE_BASE_URL_W500 = `${process.env.REACT_APP_TMDB_IMG}/w500`;         // базовий URL для отримання зображень
const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

function CrewPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB, language } = useSelector((state) => state.config);
    const tmdbLanguage = getTmdbLanguage(language);

    // Дані про людину
    const [crew, setCrew] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Дані про папки користувача
    const [folders, setFolders] = useState([])                  // Папки
    const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос


    // Загрузка даних про людину
    useEffect(() => {
        setIsLoading(true)

        instance
            .get(`${process.env.REACT_APP_URL_TMDB}/person/${id}`, {
                params: {
                    api_key: API_KEY,
                    language: tmdbLanguage,
                    append_to_response: "combined_credits"
                }
            })
            .then((res) => {
                setCrew(res.data)
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err, "Failed to load crew member")
                setIsLoading(false)
            })
    }, [id, tmdbLanguage])

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
    }, [isGetFolders])

    // Фільтруємо тільки crew ролі (без акторських ролей)
    const crewCredits = crew?.combined_credits?.crew || []

    // Групуємо фільми за ID та об'єднуємо ролі
    const groupedItems = crewCredits.reduce((acc, item) => {
        if (!acc[item.id]) {
            // Створюємо новий об'єкт фільму з об'єднаними ролями
            acc[item.id] = {
                ...item,
                job: item.job,
                department: item.department
            };
        } else {
            // Додаємо роль до існуючого фільму
            acc[item.id].job = acc[item.id].job + ', ' + item.job;
            // Якщо відділи різні, додаємо їх теж
            if (acc[item.id].department !== item.department) {
                acc[item.id].department = acc[item.id].department + ', ' + item.department;
            }
        }
        return acc;
    }, {});

    // Конвертуємо об'єкт назад в масив
    const uniqueItems = Object.values(groupedItems).filter(item => typeTMDB.includes(item.media_type));

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress color="text.main" />
                </Box>
            ) : !crew ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Typography variant="h6" color="text.secondary">
                        Crew member not found
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
                            crew.profile_path && `url(${IMAGE_BASE_URL_ORIGINAL}${crew.profile_path})`,
                        ].filter(Boolean).join(", "),
                    }}>
                        <Box sx={heroInnerSx}>
                            {/* Profile Photo */}
                            <Card sx={heroPortraitSx}>
                                <CardMedia
                                    component="img"
                                    image={crew.profile_path
                                        ? `${IMAGE_BASE_URL_W500}${crew.profile_path}`
                                        : IMAGE_DEFAULT
                                    }
                                    alt={crew.name}
                                    sx={heroMediaSx}
                                />
                            </Card>

                            {/* Crew Info */}
                            <Box sx={{ color: "white", ...heroInfoSx }}>
                                <Typography variant="h3" sx={heroTitleSx}>
                                    {crew.name}
                                </Typography>

                                {crew.birthday && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Born: {new Date(crew.birthday).toLocaleDateString(tmdbLanguage, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                )}
                                {crew.place_of_birth && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        {crew.place_of_birth}
                                    </Typography>
                                )}
                                {crew.deathday && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Died: {new Date(crew.deathday).toLocaleDateString(tmdbLanguage, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                )}
                                {crew.known_for_department && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Known for: {crew.known_for_department}
                                    </Typography>
                                )}

                                {/* Statistics in Hero Section */}
                                <Box sx={heroStatsSx}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={heroStatValueSx}>
                                            {uniqueItems.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={heroStatValueSx}>
                                            {crewCredits.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total Roles
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={heroStatValueSx}>
                                            {Math.round(crew.popularity)}
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
                                {crew.biography || "No biography available."}
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
                        preperedData={uniqueItems}
                        // Інформація сторінки
                        pageType="crew"
                        pageTitle="Filmography"
                        isSearch={true}
                        isSort={true}
                    />
                </>
            )}
        </Box>
    )
}

export default CrewPage 