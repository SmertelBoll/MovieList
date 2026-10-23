import { Box, Chip, CircularProgress, debounce, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import Search from '../../components/Sorting/Search'
import FolderSearchResults from './FolderSearchResults'
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
import { yellowHoverSx } from '../../theme/hoverSx'

function FoldersPage() {
    const isAuth = useSelector(selectIsAuth)
    const { typeTMDB, customTypes } = useSelector((state) => state.config)

    const [folders, setFolders] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // The search box shows results from all folders instead of the folder grid.
    const [inputText, setInputText] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const updateSearchQuery = useMemo(() => debounce((str) => setSearchQuery(str.trim()), 400), [])
    useEffect(() => () => updateSearchQuery.clear(), [updateSearchQuery])
    const onChangeSearch = (e, empty = false) => {
        const next = empty ? '' : e.target.value
        setInputText(next)
        updateSearchQuery(next)
    }

    const [curFolderToRename, setCurFolderToRename] = useState(null)
    const [curFolderName, setCurFolderName] = useState('')

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

    // Counts are computed on the client for the active filters (movie/tv + customType), so changing a filter
    // doesn't reload the page.
    const getCount = (folder) => {
        const elements = folder.elements || []
        return elements.filter(el => {
            if (!typeTMDB.includes(el.media_type)) return false
            if (customTypes.length === 0) return true
            // An item has several tags: it matches if any one matches; "No tag" when it has none.
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
    const fileToBase = (file) =>
        new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onloadend = () => resolve(reader.result)
        })

    const handleClickAddImage = (folder) => {
        folderForImageRef.current = folder
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
            const { data } = await instance.post('/upload', { image: base64 })
            const url = data.url
            await instance.patch(`/folders/image/${folder.name}`, { image: url, imagePublicId: data.publicId })
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

    // No filters (both types, no tags): show all folders, even empty. With a filter: only folders with a
    // remaining item. A folder being renamed is never hidden, so its input doesn't vanish.
    const hasFilters = customTypes.length > 0 || typeTMDB.length < 2
    const sorted = [...folders]
        .filter((folder) => !hasFilters || getCount(folder) > 0 || curFolderToRename?.order === folder.order)
        .sort((a, b) => b.order - a.order)

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: { xs: 1, sm: 3 }, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
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

            <Search inputText={inputText} onChangeInput={onChangeSearch} label="Search movies & TV shows" />

            {searchQuery ? (
                <FolderSearchResults query={searchQuery} folders={folders} setFolders={setFolders} />
            ) : (
            <>

            {sorted.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography variant="h6" color="text.secondary">
                        {hasFilters && folders.length > 0 ? 'No folders match the filters' : 'No folders yet'}
                    </Typography>
                </Box>
            ) : (
                <Box sx={{
                    display: 'grid',
                    // Exactly two columns on phones: auto-fill with a 200px minimum would collapse to one,
                    // there isn't that much room.
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
                                    // Otherwise the content stops the column from shrinking and the grid
                                    // overflows sideways.
                                    minWidth: 0,
                                    borderRadius: 2,
                                    transition: 'background-color 0.15s, transform 0.15s',
                                    ...(!isRenaming && yellowHoverSx),
                                }}
                            >
                                {!isRenaming && <StretchedLink to={`/folders/${encodeURIComponent(folder.name)}`} label={folder.name} />}

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
                                                // 11rem (176px) doesn't fit a ~124px column on phones
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

                                <Box
                                    onClick={(e) => e.stopPropagation()}
                                    // The ⋮ icon inherits its color; without an explicit one it stayed black
                                    // and vanished in dark theme.
                                    sx={{ position: 'absolute', top: 4, right: 4, zIndex: 1, color: 'text.main' }}
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
            </>
            )}
        </Box>
    )
}

export default FoldersPage
