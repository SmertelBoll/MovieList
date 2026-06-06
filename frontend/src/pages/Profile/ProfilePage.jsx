import { Avatar, Box, Chip, CircularProgress, IconButton, Typography, useTheme } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import instance from '../../axios'
import { alertError, alertSuccess, alertConfirm } from '../../alerts'
import { selectIsAuth, setUserTypeCustom, updateUserData } from '../../redux/slices/AuthSlice'
import TextFieldCustom from '../../components/_customMUI/TextFieldCustom'
import MainButton from '../../components/Buttons/MainButton'

import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'

// Перетворюємо файл у base64 для завантаження на /upload
const fileToBase = (file) =>
    new Promise((resolve) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => resolve(reader.result)
    })

function ProfilePage() {
    const theme = useTheme()
    const dispatch = useDispatch()
    const isAuth = useSelector(selectIsAuth)
    const user = useSelector((state) => state.auth.data)

    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.bg.second, theme.palette.text.main]
    )

    const [fullName, setFullName] = useState(user?.fullName || '')
    const [newType, setNewType] = useState('')
    const [savingName, setSavingName] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const fileInputRef = useRef(null)
    const userTypes = user?.typeCustom || []

    // Підставляємо поточне ім'я, коли дані користувача завантажились
    useEffect(() => {
        setFullName(user?.fullName || '')
    }, [user?.fullName])

    if (!isAuth) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <Typography variant="h6" color="text.secondary">
                    Please log in to see your profile
                </Typography>
            </Box>
        )
    }

    // -- AVATAR -- //
    const handleAvatarPick = () => {
        if (fileInputRef.current) fileInputRef.current.value = ''
        fileInputRef.current?.click()
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file || !file.type.startsWith('image/')) return

        try {
            setUploadingAvatar(true)
            const base64 = await fileToBase(file)
            const { data } = await instance.post('/upload', { image: base64 })
            await instance.patch('/auth/profile', { avatar: data.url, avatarPublicId: data.publicId })
            dispatch(updateUserData({ avatar: data.url }))
            alertSuccess('Avatar updated')
        } catch (err) {
            console.warn(err)
            alertError(err)
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleAvatarRemove = async () => {
        try {
            setUploadingAvatar(true)
            await instance.patch('/auth/profile', { avatar: '', avatarPublicId: '' })
            dispatch(updateUserData({ avatar: '' }))
        } catch (err) {
            console.warn(err)
            alertError(err)
        } finally {
            setUploadingAvatar(false)
        }
    }

    // -- NAME -- //
    const handleSaveName = async () => {
        const trimmed = fullName.trim()
        if (!trimmed || trimmed === user?.fullName) return

        try {
            setSavingName(true)
            const { data } = await instance.patch('/auth/profile', { fullName: trimmed })
            dispatch(updateUserData({ fullName: data.results.fullName }))
            alertSuccess('Name updated')
        } catch (err) {
            console.warn(err)
            alertError(err)
        } finally {
            setSavingName(false)
        }
    }

    // -- CUSTOM TYPES -- //
    const saveTypes = async (newList) => {
        try {
            await instance.patch('/auth/settings', { typeCustom: newList })
            dispatch(setUserTypeCustom(newList))
        } catch (err) {
            console.warn(err)
            alertError(err)
        }
    }

    const handleAddType = async () => {
        const value = newType.trim()
        if (!value || userTypes.includes(value)) {
            setNewType('')
            return
        }
        await saveTypes([...userTypes, value])
        setNewType('')
    }

    const handleDeleteType = (type) => {
        alertConfirm(
            `Delete "${type}"? It will also be removed from all movies and TV shows that use it.`,
            async () => {
                try {
                    const { data } = await instance.delete(`/auth/types/${encodeURIComponent(type)}`)
                    dispatch(setUserTypeCustom(data.results.typeCustom))
                } catch (err) {
                    console.warn(err)
                    alertError(err)
                }
            }
        )
    }

    const nameChanged = fullName.trim() && fullName.trim() !== user?.fullName

    const cardSx = {
        bgcolor: 'bg.second',
        borderRadius: 3,
        p: { xs: 2, sm: 4 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
    }

    const sectionTitleSx = { color: 'text.main', fontWeight: 700 }

    return (
        <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
            />

            {/* HEADER: avatar + name preview */}
            <Box sx={{ ...cardSx, alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ position: 'relative', width: 140, height: 140 }}>
                    <Avatar
                        src={user?.avatar || undefined}
                        onClick={uploadingAvatar ? undefined : handleAvatarPick}
                        sx={{
                            width: 140,
                            height: 140,
                            boxSizing: 'border-box',
                            fontSize: 56,
                            bgcolor: 'bg.selected',
                            color: 'text.main',
                            border: '3px solid',
                            borderColor: 'yellow.main',
                            cursor: uploadingAvatar ? 'default' : 'pointer',
                        }}
                    >
                        {user?.fullName?.[0]?.toUpperCase()}
                    </Avatar>

                    {uploadingAvatar && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '50%',
                                bgcolor: 'rgba(0,0,0,0.45)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CircularProgress size={36} sx={{ color: 'yellow.main' }} />
                        </Box>
                    )}

                    {/* Camera button */}
                    <IconButton
                        onClick={handleAvatarPick}
                        disabled={uploadingAvatar}
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: 'yellow.main',
                            color: 'text.dark',
                            '&:hover': { bgcolor: 'yellow.dark' },
                        }}
                    >
                        <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box>
                    <Typography variant="h5" sx={{ color: 'text.main', fontWeight: 700, wordBreak: 'break-word' }}>
                        {user?.fullName}
                    </Typography>
                    {user?.email && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {user.email}
                        </Typography>
                    )}
                </Box>

                {user?.avatar && (
                    <MainButton
                        onClick={handleAvatarRemove}
                        disabled={uploadingAvatar}
                        startIcon={<DeleteOutlineIcon />}
                        sx={{
                            bgcolor: 'transparent',
                            color: 'text.main',
                            border: '1px solid',
                            borderColor: 'text.secondary',
                            px: 3,
                            ':hover': { bgcolor: 'bg.selected' },
                        }}
                    >
                        Remove photo
                    </MainButton>
                )}
            </Box>

            {/* NAME */}
            <Box sx={cardSx}>
                <Typography variant="h6" sx={sectionTitleSx}>
                    Display name
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                        <InputBox
                            fullWidth
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your name"
                        />
                    </Box>
                    <MainButton onClick={handleSaveName} disabled={!nameChanged || savingName} sx={{ m: 0 }}>
                        {savingName ? 'Saving...' : 'Save'}
                    </MainButton>
                </Box>
            </Box>

            {/* CUSTOM TYPES */}
            <Box sx={cardSx}>
                <Box>
                    <Typography variant="h6" sx={sectionTitleSx}>
                        Custom types
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Your personal labels for movies and TV shows.
                    </Typography>
                </Box>

                {/* Existing types */}
                {userTypes.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {userTypes.map((type) => (
                            <Chip
                                key={type}
                                label={type}
                                onDelete={() => handleDeleteType(type)}
                                sx={{
                                    bgcolor: 'yellow.main',
                                    color: 'text.dark',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    '& .MuiChip-deleteIcon': {
                                        color: 'text.dark',
                                        '&:hover': { color: 'text.main' },
                                    },
                                }}
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No custom types yet.
                    </Typography>
                )}

                {/* Add new type */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                        <InputBox
                            fullWidth
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddType() }}
                            placeholder="e.g. Anime, Documentary..."
                        />
                    </Box>
                    <MainButton onClick={handleAddType} disabled={!newType.trim()} startIcon={<AddIcon />} sx={{ m: 0 }}>
                        Add
                    </MainButton>
                </Box>
            </Box>
        </Box>
    )
}

export default ProfilePage
