import { Box, Typography, Chip, Grid2, Card, CardMedia, CardContent } from '@mui/material'
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
import { tmdbGet } from '../../utils/tmdbApi'
import CenteredState from '../../components/CenteredState'


function CrewPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB, language } = useSelector((state) => state.config);
    const tmdbLanguage = getTmdbLanguage(language);

    const [crew, setCrew] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)


    useEffect(() => {
        setIsLoading(true)

        tmdbGet(`/person/${id}`, { language: tmdbLanguage, append_to_response: "combined_credits" })
            .then((data) => {
                setCrew(data)
                setIsLoading(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err, "Failed to load crew member")
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
    }, [isGetFolders])

    const crewCredits = crew?.combined_credits?.crew || []

    const groupedItems = crewCredits.reduce((acc, item) => {
        if (!acc[item.id]) {
            acc[item.id] = {
                ...item,
                job: item.job,
                department: item.department
            };
        } else {
            acc[item.id].job = acc[item.id].job + ', ' + item.job;
            if (acc[item.id].department !== item.department) {
                acc[item.id].department = acc[item.id].department + ', ' + item.department;
            }
        }
        return acc;
    }, {});

    const uniqueItems = Object.values(groupedItems).filter(item => typeTMDB.includes(item.media_type));

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {isLoading ? (
                <CenteredState minHeight={400} loading />
            ) : !crew ? (
                <CenteredState minHeight={400}>Crew member not found</CenteredState>
            ) : (
                <>
                    {/* Hero Section */}
                    <Box sx={{
                        ...heroSectionSx,
                        backgroundImage: (theme) => [
                            `linear-gradient(${theme.palette.overlay.soft}, ${theme.palette.overlay.soft})`,
                            crew.profile_path && `url(${tmdbImage(crew.profile_path, 'original')})`,
                        ].filter(Boolean).join(", "),
                    }}>
                        <Box sx={heroInnerSx}>
                            {/* Profile Photo */}
                            <Card sx={heroPortraitSx}>
                                <CardMedia
                                    component="img"
                                    image={tmdbImageOrDefault(crew.profile_path, 'w500')}
                                    alt={crew.name}
                                    sx={heroMediaSx}
                                />
                            </Card>

                            {/* Crew Info */}
                            <Box sx={{ color: "overlay.onImage", ...heroInfoSx }}>
                                <Typography variant="heroTitle" sx={heroTitleSx}>
                                    {crew.name}
                                </Typography>

                                {crew.birthday && (
                                    <Typography variant="heroSubtitle">
                                        Born: {formatDateOnly(crew.birthday)}
                                    </Typography>
                                )}
                                {crew.place_of_birth && (
                                    <Typography variant="heroSubtitle">
                                        {crew.place_of_birth}
                                    </Typography>
                                )}
                                {crew.deathday && (
                                    <Typography variant="heroSubtitle">
                                        Died: {formatDateOnly(crew.deathday)}
                                    </Typography>
                                )}
                                {crew.known_for_department && (
                                    <Typography variant="heroSubtitle">
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
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        dbType="tmdb"
                        urlParams={false}
                        isPreperedData={true}
                        preperedData={uniqueItems}
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