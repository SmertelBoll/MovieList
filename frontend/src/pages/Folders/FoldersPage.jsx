import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import StretchedLink from '../../components/StretchedLink'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import { NO_TAG } from '../../redux/slices/ConfigSlice'
import instance from '../../axios'
import { alertConfirm, alertError } from '../../alerts'
import FolderIcon from '@mui/icons-material/Folder'
import UpdateFolder from '../../components/SideBar/UpdateFolder'
import RenameFolderInput from '../../components/SideBar/RenameFolderInput'
import { getStatusLabel, getStatusChipSx } from '../../utils/folderStatus'

function FoldersPage() {
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB, customTypes } = useSelector((state) => state.config)

    const [folders, setFolders] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const [curFolderToRename, setCurFolderToRename] = useState(null)
    const [curFolderName, setCurFolderName] = useState('')

    // Завантаження картинки папки
    const fileInputRef = useRef(null)
    const folderForImageRef = useRef(null)
    const [uploadingFolder, setUploadingFolder] = useState(null)

    useEffect(() => {
        if (isAuth) {
            setIsLoading(true)
            instance
                .get('/folders')
                .then((res) => {
                    setFolders(res.data.results)
                    setIsLoading(false)
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err)
                    setIsLoading(false)
                })
        } else {
            setIsLoading(false)
        }
    }, [isAuth])

    // Рахуємо кількість на клієнті за активними фільтрами (movie/tv + customType),
    // тож зміна фільтра не перезавантажує сторінку.
    const getCount = (folder) => {
        const elements = folder.elements || []
        return elements.filter(el => {
            if (!typeTMDB.includes(el.media_type)) return false
            if (customTypes.length === 0) return true
            // елемент має кілька тегів: підходить, якщо збігся хоч один; "No tag" — коли тегів немає
            const tags = el.customTypes || []
            return tags.some((tag) => customTypes.includes(tag)) ||
                (customTypes.includes(NO_TAG) && tags.length === 0)
        }).length
    }

    // -- RENAME --
    const handleClickRename = (folder) => {
        setCurFolderToRename(folder)
        setCurFolderName(folder.name)
    }
    const handleInputChange = (e) => setCurFolderName(e.target.value)
    const handleUpdateFolderName = (folder, newName) => {
        instance
            .patch(`/folders/${folder.name}`, { name: newName })
            .then(() => {
                setFolders(prev =>
                    prev.map(f => f.name === folder.name ? { ...f, name: newName } : f)
                )
                setCurFolderToRename(null)
                setCurFolderName('')
            })
            .catch((err) => { console.warn(err); alertError(err) })
    }

    // -- IMAGE --
    // Перетворюємо файл у base64, щоб відправити на /upload
    const fileToBase = (file) =>
        new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onloadend = () => resolve(reader.result)
        })

    const handleClickAddImage = (folder) => {
        folderForImageRef.current = folder
        // даємо вибрати той самий файл повторно
        if (fileInputRef.current) fileInputRef.current.value = ''
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        const folder = folderForImageRef.current
        if (!file || !folder) return

        try {
            setUploadingFolder(folder.name)
            const base64 = await fileToBase(file)
            // 1) завантажуємо картинку в Cloudinary
            const { data } = await instance.post('/upload', { image: base64 })
            const url = data.url
            // 2) зберігаємо URL та public_id у папці (publicId потрібен для видалення з Cloudinary)
            await instance.patch(`/folders/image/${folder.name}`, { image: url, imagePublicId: data.publicId })
            // 3) оновлюємо локально
            setFolders(prev => prev.map(f => f.name === folder.name ? { ...f, image: url } : f))
        } catch (err) {
            console.warn(err)
            alertError(err)
        } finally {
            setUploadingFolder(null)
            folderForImageRef.current = null
        }
    }

    const handleClickRemoveImage = (folder) => {
        instance
            .patch(`/folders/image/${folder.name}`, { image: '', imagePublicId: '' })
            .then(() => {
                setFolders(prev => prev.map(f => f.name === folder.name ? { ...f, image: '', imagePublicId: '' } : f))
            })
            .catch((err) => { console.warn(err); alertError(err) })
    }

    // -- DELETE --
    const handleClickDelete = (folder, pressure = false) => {
        const doDelete = () => {
            instance
                .delete(`/folders/${folder.name}`)
                .then(() => {
                    setFolders(prev => prev.filter(f => f.name !== folder.name))
                    setCurFolderToRename(null)
                })
                .catch((err) => { console.warn(err); alertError(err) })
        }
        if (pressure) doDelete()
        else alertConfirm('Are you sure?', doDelete)
    }

    // -- ORDER: оновлюємо локально, без рефетчу (без моргання) --
    const handleChangeStatus = (folder, status) => {
        instance
            .patch(`/folders/status/${folder.name}`, { status })
            .then((res) => {
                setFolders(prev => prev.map(f => f.name === folder.name ? { ...f, status: res.data.results.status } : f))
            })
            .catch((err) => { console.warn(err); alertError(err) })
    }

    const handleIncrementOrder = (folder) => {
        instance
            .patch(`/folders/orderIncrement/${folder.name}`)
            .then((res) => {
                if (res.data.success) {
                    setFolders(prev => prev.map(f => {
                        if (f.name === folder.name) return { ...f, order: folder.order + 1 }
                        if (f.order === folder.order + 1) return { ...f, order: folder.order }
                        return f
                    }))
                }
            })
            .catch((err) => { console.warn(err); alertError(err) })
    }
    const handleDecrementOrder = (folder) => {
        instance
            .patch(`/folders/orderDecrement/${folder.name}`)
            .then((res) => {
                if (res.data.success) {
                    setFolders(prev => prev.map(f => {
                        if (f.name === folder.name) return { ...f, order: folder.order - 1 }
                        if (f.order === folder.order - 1) return { ...f, order: folder.order }
                        return f
                    }))
                }
            })
            .catch((err) => { console.warn(err); alertError(err) })
    }

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress color="primary" />
            </Box>
        )
    }

    if (!isAuth) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography variant="h6" color="text.secondary">
                    Please log in to see your folders
                </Typography>
            </Box>
        )
    }

    // Без фільтрів (обидва типи й жодного тегу) показуємо всі папки, навіть порожні.
    // Є фільтр — лише папки, де після нього лишився хоч один елемент. Папку, яку зараз
    // перейменовують, не ховаємо, щоб поле вводу не зникло.
    const hasFilters = customTypes.length > 0 || typeTMDB.length < 2
    const sorted = [...folders]
        .filter((folder) => !hasFilters || getCount(folder) > 0 || curFolderToRename?.order === folder.order)
        .sort((a, b) => b.order - a.order)

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            {/* Прихований input для вибору картинки папки */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <Typography variant="p" color="text.main">
                My Folders
            </Typography>

            {sorted.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography variant="h6" color="text.secondary">
                        {hasFilters && folders.length > 0 ? 'No folders match the filters' : 'No folders yet'}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{
                    display: 'grid',
                    // На телефоні рівно дві колонки: auto-fill з мінімумом 200px
                    // згортався б в одну, бо стільки місця там просто немає
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(auto-fill, minmax(200px, 1fr))'
                    },
                    gridAutoRows: '1fr',
                    gap: { xs: 2, sm: 4 },
                }}>
                    {sorted.map((folder) => {
                        const count = getCount(folder)
                        const isRenaming = curFolderToRename?.order === folder.order

                        return (
                            <Box
                                key={folder.name}
                                sx={{
                                    position: 'relative',
                                    height: '100%',
                                    // Інакше вміст не дає колонці стиснутись і сітка їде вбік
                                    minWidth: 0,
                                    borderRadius: 2,
                                    transition: 'background-color 0.15s, transform 0.15s',
                                    ...(!isRenaming && {
                                        '@media (hover: hover)': { '&:hover': {
                                            transform: (theme) => theme.hoverLift,
                                            bgcolor: 'yellow.main',
                                            // На жовтому весь вміст картки темніє:
                                            // і підписи, і іконка папки, і лічильник
                                            color: 'yellow.contrastText',
                                            '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                            '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                        } },
                                    }),
                                }}
                            >
                                {/* Справжнє посилання на всю картку: працюють колесо миші та Ctrl/Cmd+клік */}
                                {!isRenaming && <StretchedLink to={`/folders/${encodeURIComponent(folder.name)}`} label={folder.name} />}

                                {/* Картка */}
                                <Box
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1,
                                        cursor: isRenaming ? 'default' : 'pointer',
                                        p: 1,
                                    }}
                                >
                                    {/* Картинка папки або стандартна іконка */}
                                    {uploadingFolder === folder.name ? (
                                        <Box sx={{ height: { xs: '7rem', sm: '11rem' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CircularProgress color="primary" />
                                        </Box>
                                    ) : folder.image ? (
                                        <Box
                                            component="img"
                                            src={folder.image}
                                            alt={folder.name}
                                            sx={{
                                                // 11rem (176px) не влазить у колонку ~124px на телефоні
                                                height: { xs: '7rem', sm: '11rem' },
                                                width: { xs: '7rem', sm: '11rem' },
                                                maxWidth: '100%',
                                                objectFit: 'cover',
                                                borderRadius: 2,
                                            }}
                                        />
                                    ) : (
                                        <FolderIcon sx={{ fontSize: { xs: '7rem', sm: '11rem' }, color: 'text.main' }} />
                                    )}

                                    {/* Назва або input для перейменування */}
                                    {isRenaming ? (
                                        <RenameFolderInput
                                            curFolderName={curFolderName}
                                            handleInputChange={handleInputChange}
                                            handleUpdateFolderName={handleUpdateFolderName}
                                            folder={folder}
                                            handleClickDelete={handleClickDelete}
                                            isInputNewFolder={false}
                                        />
                                    ) : (
                                        <>
                                            <Typography
                                                variant="body2"
                                                color="text.main"
                                                fontWeight="bold"
                                                textAlign="center"
                                                sx={{ wordBreak: 'break-word' }}
                                            >
                                                {folder.name}
                                            </Typography>
                                            {/* Тут статус тільки показуємо — міняється через меню ⋮ */}
                                            <Chip
                                                size="small"
                                                label={getStatusLabel(folder.status)}
                                                sx={{ ...getStatusChipSx(folder.status), height: 22, maxWidth: '100%' }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {count} {count === 1 ? 'item' : 'items'}
                                            </Typography>
                                        </>
                                    )}
                                </Box>

                                {/* Кнопка ⋮ */}
                                <Box
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
                                >
                                    <UpdateFolder
                                        hasImage={Boolean(folder.image)}
                                        status={folder.status}
                                        actionFunctions={{
                                            handleClickRename: () => handleClickRename(folder),
                                            handleClickAddImage: () => handleClickAddImage(folder),
                                            handleClickRemoveImage: () => handleClickRemoveImage(folder),
                                            handleClickDelete: () => handleClickDelete(folder),
                                            handleIncrementOrder: () => handleIncrementOrder(folder),
                                            handleDecrementOrder: () => handleDecrementOrder(folder),
                                            handleChangeStatus: (status) => handleChangeStatus(folder, status),
                                        }}
                                    />
                                </Box>
                            </Box>
                        )
                    })}
                </Box>
            )}
        </Box>
    )
}

export default FoldersPage
