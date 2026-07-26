import { Box, Typography, CircularProgress, Card, CardMedia } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'
import {
    heroSectionSx, heroInnerSx, heroLandscapeSx,
    heroInfoSx, heroTitleSx, heroSubtitleSx, heroStatsSx, heroStatValueSx
} from './heroStyles'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const IMAGE_BASE_URL_ORIGINAL = `${process.env.REACT_APP_TMDB_IMG}/original`;         // базовий URL для отримання зображень
const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

function CompanyPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB } = useSelector((state) => state.config);


    // Дані про компанію
    const [company, setCompany] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [totalItems, setTotalItems] = useState(null)

    // Дані про папки користувача
    const [folders, setFolders] = useState([])                  // Папки
    const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос


    // Загрузка даних про компанію
    useEffect(() => {
        setIsLoading(true)

        // Спочатку отримуємо основну інформацію про компанію
        instance
            .get(`${process.env.REACT_APP_URL_TMDB}/company/${id}`, {
                params: {
                    api_key: API_KEY,
                    language: "en-US"
                }
            })
            .then((res) => {
                setCompany(res.data)

                // Тепер отримуємо першу сторінку фільмів компанії
                const endpoint = `${process.env.REACT_APP_URL_TMDB}/discover`

                let params = {
                    api_key: API_KEY,
                    language: "en-US",
                    with_companies: id,
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
                        alertError(err, "Failed to load company")
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
                        ...heroSectionSx,
                        // Саме backgroundImage, а не background: скорочений запис скинув би
                        // backgroundSize/Position із heroSectionSx і фон з'їхав би в кут
                        backgroundImage: [
                            "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7))",
                            company.logo_path && `url(${IMAGE_BASE_URL_ORIGINAL}${company.logo_path})`,
                        ].filter(Boolean).join(", "),
                    }}>
                        <Box sx={heroInnerSx}>
                            {/* Company Logo */}
                            <Card sx={{
                                ...heroLandscapeSx,
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {company.logo_path ? (
                                    <CardMedia
                                        component="img"
                                        image={`${IMAGE_BASE_URL_ORIGINAL}${company.logo_path}`}
                                        alt={company.name}
                                        sx={{
                                            objectFit: 'contain',
                                            width: '100%',
                                            height: '100%',
                                            maxWidth: { xs: '100%', md: '280px' },
                                            maxHeight: { xs: '100%', md: '180px' },
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
                            <Box sx={{ color: "white", ...heroInfoSx }}>
                                <Typography variant="h3" sx={heroTitleSx}>
                                    {company.name || 'Unknown Company'}
                                </Typography>

                                {company.origin_country && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Country: {company.origin_country}
                                    </Typography>
                                )}
                                {company.headquarters && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Headquarters: {company.headquarters}
                                    </Typography>
                                )}
                                {company.parent_company && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
                                        Parent: {company.parent_company.name}
                                    </Typography>
                                )}
                                {company.homepage && (
                                    <Typography variant="h6" sx={heroSubtitleSx}>
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
                                <Box sx={heroStatsSx}>
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="h4" sx={heroStatValueSx}>
                                            {totalItems ? totalItems : "-"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                            Total
                                        </Typography>
                                    </Box>

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

                    {/* Items Section */}
                    <GeneralItemList
                        // Бокова панель
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        // Робота з базами даних
                        dbType="tmdb"
                        urlParams={{ with_companies: id }}
                        isPreperedData={false}
                        preperedData={false}
                        // Інформація сторінки
                        pageType="company"
                        pageTitle="Filmography"
                        isSearch={false}
                        isSort={true}
                    />


                </>
            )}
        </Box>
    )
}

export default CompanyPage
