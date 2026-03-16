import { Box, Typography, CircularProgress, Card, CardMedia } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'

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
                        position: "relative",
                        height: "400px",
                        borderRadius: 2,
                        overflow: "hidden",
                        background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${IMAGE_BASE_URL_ORIGINAL}${company.logo_path})`,
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
                                        image={`${IMAGE_BASE_URL_ORIGINAL}${company.logo_path}`}
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
                            <Box sx={{ color: "white", flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                                    {company.name || 'Unknown Company'}
                                </Typography>

                                {company.origin_country && (
                                    <Typography variant="h6">
                                        Country: {company.origin_country}
                                    </Typography>
                                )}
                                {company.headquarters && (
                                    <Typography variant="h6">
                                        Headquarters: {company.headquarters}
                                    </Typography>
                                )}
                                {company.parent_company && (
                                    <Typography variant="h6">
                                        Parent: {company.parent_company.name}
                                    </Typography>
                                )}
                                {company.homepage && (
                                    <Typography variant="h6">
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
