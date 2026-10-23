import { Box, Typography, CircularProgress, Card, CardMedia } from '@mui/material'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios'
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'
import { getTmdbLanguage } from '../../utils/languages'
import {
    heroSectionSx, heroInnerSx, heroLandscapeSx,
    heroInfoSx, heroTitleSx, heroSubtitleSx, heroStatsSx, heroStatValueSx
} from './heroStyles'
import { tmdbImage } from '../../utils/tmdbImage'
import { tmdbGet } from '../../utils/tmdbApi'


function CompanyPage() {
    const { id } = useParams()
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB, language } = useSelector((state) => state.config);
    const tmdbLanguage = getTmdbLanguage(language);


    const [company, setCompany] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [totalItems, setTotalItems] = useState(null)

    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)


    useEffect(() => {
        setIsLoading(true)

        tmdbGet(`/company/${id}`, { language: tmdbLanguage })
            .then((data) => {
                setCompany(data)

                const endpoint = '/discover'

                let params = {
                    language: tmdbLanguage,
                    with_companies: id,
                    page: 1
                };

                Promise.all(
                    typeTMDB.map(type =>
                        tmdbGet(`${endpoint}/${type}`, params)
                            .then(data => ({
                                totalResults: data.total_results
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
    }, [id, typeTMDB, tmdbLanguage])

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
                        backgroundImage: (theme) => [
                            `linear-gradient(${theme.palette.overlay.soft}, ${theme.palette.overlay.soft})`,
                            company.logo_path && `url(${tmdbImage(company.logo_path, 'original')})`,
                        ].filter(Boolean).join(", "),
                    }}>
                        <Box sx={heroInnerSx}>
                            {/* Company Logo */}
                            <Card sx={{
                                ...heroLandscapeSx,
                                backgroundColor: 'overlay.onImage',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {company.logo_path ? (
                                    <CardMedia
                                        component="img"
                                        image={tmdbImage(company.logo_path, 'original')}
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
                                    backgroundColor: 'bg.selected',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                        {company.name?.charAt(0) || 'C'}
                                    </Typography>
                                </Box>
                            </Card>

                            {/* Company Info */}
                            <Box sx={{ color: "overlay.onImage", ...heroInfoSx }}>
                                <Typography variant="heroTitle" sx={heroTitleSx}>
                                    {company.name || 'Unknown Company'}
                                </Typography>

                                {company.origin_country && (
                                    <Typography variant="heroSubtitle">
                                        Country: {company.origin_country}
                                    </Typography>
                                )}
                                {company.headquarters && (
                                    <Typography variant="heroSubtitle">
                                        Headquarters: {company.headquarters}
                                    </Typography>
                                )}
                                {company.parent_company && (
                                    <Typography variant="heroSubtitle">
                                        Parent: {company.parent_company.name}
                                    </Typography>
                                )}
                                {company.homepage && (
                                    <Typography variant="heroSubtitle">
                                        <a
                                            href={company.homepage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'inherit', textDecoration: 'underline' }}
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
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        dbType="tmdb"
                        urlParams={{ with_companies: id }}
                        isPreperedData={false}
                        preperedData={false}
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
