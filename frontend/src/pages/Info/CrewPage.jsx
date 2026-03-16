import { Box, Typography, CircularProgress, Chip, Grid2, Card, CardMedia, CardContent } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const IMAGE_BASE_URL_ORIGINAL = `${process.env.REACT_APP_TMDB_IMG}/original`; // базовий URL для отримання зображень
const IMAGE_BASE_URL_W500 = `${process.env.REACT_APP_TMDB_IMG}/w500`;         // базовий URL для отримання зображень
const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

function CrewPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB } = useSelector((state) => state.config);

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
                    language: "en-US",
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
                        position: "relative",
                        height: "400px",
                        borderRadius: 2,
                        overflow: "hidden",
                        background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${IMAGE_BASE_URL_ORIGINAL}${crew.profile_path})`,
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
                                    image={crew.profile_path
                                        ? `${IMAGE_BASE_URL_W500}${crew.profile_path}`
                                        : IMAGE_DEFAULT
                                    }
                                    alt={crew.name}
                                />
                            </Card>

                            {/* Crew Info */}
                            <Box sx={{ color: "white", flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                                    {crew.name}
                                </Typography>

                                {crew.birthday && (
                                    <Typography variant="h6">
                                        Born: {new Date(crew.birthday).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                )}
                                {crew.place_of_birth && (
                                    <Typography variant="h6">
                                        {crew.place_of_birth}
                                    </Typography>
                                )}
                                {crew.deathday && (
                                    <Typography variant="h6">
                                        Died: {new Date(crew.deathday).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                )}
                                {crew.known_for_department && (
                                    <Typography variant="h6">
                                        Known for: {crew.known_for_department}
                                    </Typography>
                                )}

                                {/* Statistics in Hero Section */}
                                <Box sx={{ mt: 3, display: "flex", gap: 4 }}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                            {uniqueItems.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                                            {crewCredits.length}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total Roles
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