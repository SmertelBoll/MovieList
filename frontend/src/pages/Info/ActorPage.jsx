import { Box, Typography, CircularProgress, Card, CardMedia } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'
import { getTmdbLanguage } from '../../utils/languages'
import { formatDateOnly } from '../../utils/dates'
import {
    heroSectionSx, heroInnerSx, heroPortraitSx, heroMediaSx,
    heroInfoSx, heroTitleSx, heroSubtitleSx, heroStatsSx, heroStatValueSx
} from './heroStyles'
import { tmdbImage, tmdbImageOrDefault } from '../../utils/tmdbImage'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY

function ActorPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB, language } = useSelector((state) => state.config);
    const tmdbLanguage = getTmdbLanguage(language);

    const [actor, setActor] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)


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
                setActor(res.data)
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err, "Failed to load actor")
                setIsLoading(false)
            })
    }, [id, tmdbLanguage])

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
                        backgroundImage: (theme) => [
                            `linear-gradient(${theme.palette.overlay.soft}, ${theme.palette.overlay.soft})`,
                            actor.profile_path && `url(${tmdbImage(actor.profile_path, 'original')})`,
                        ].filter(Boolean).join(", "),
                    }}>
                        <Box sx={heroInnerSx}>
                            {/* Profile Photo */}
                            <Card sx={heroPortraitSx}>
                                <CardMedia
                                    component="img"
                                    image={tmdbImageOrDefault(actor.profile_path, 'w500')}
                                    sx={heroMediaSx}
                                />
                            </Card>

                            {/* Actor Info */}
                            <Box sx={{ color: "overlay.onImage", ...heroInfoSx }}>
                                <Typography variant="heroTitle" sx={heroTitleSx}>
                                    {actor.name}
                                </Typography>

                                {actor.birthday && (
                                    <Typography variant="heroSubtitle">
                                        Born: {formatDateOnly(actor.birthday)}
                                    </Typography>
                                )}

                                {actor.place_of_birth && (
                                    <Typography variant="heroSubtitle">
                                        {actor.place_of_birth}
                                    </Typography>
                                )}

                                {actor.deathday && (
                                    <Typography variant="heroSubtitle">
                                        Died: {formatDateOnly(actor.deathday)}
                                    </Typography>
                                )}

                                {actor.known_for_department && (
                                    <Typography variant="heroSubtitle">
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
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        dbType="tmdb"
                        urlParams={false}
                        isPreperedData={true}
                        preperedData={uniqueActingCredits}
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