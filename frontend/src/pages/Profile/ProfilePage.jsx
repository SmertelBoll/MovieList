import { Avatar, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography, useTheme } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import instance from '../../axios'
import { alertError, alertSuccess, alertConfirm } from '../../alerts'
import { selectIsAuth, setUserTypeCustom, updateUserData } from '../../redux/slices/AuthSlice'
import TextFieldCustom from '../../components/_customMUI/TextFieldCustom'
import MainButton from '../../components/Buttons/MainButton'
import SortableTypeItem from './SortableTypeItem'

import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import CloseIcon from '@mui/icons-material/Close'
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
    // Варіант зі стандартною висотою — для полів із плаваючим label (інакше label з'їжджає)
    const LabeledInputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main),
        [theme.palette.bg.second, theme.palette.text.main]
    )

    const [fullName, setFullName] = useState(user?.fullName || '')
    const [newEmail, setNewEmail] = useState(user?.email || '')
    const [emailPassword, setEmailPassword] = useState('')
    const [newType, setNewType] = useState('')
    const [savingName, setSavingName] = useState(false)
    const [savingEmail, setSavingEmail] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [emailDialogOpen, setEmailDialogOpen] = useState(false)

    const [pwdDialogOpen, setPwdDialogOpen] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [savingPassword, setSavingPassword] = useState(false)

    const fileInputRef = useRef(null)
    const userTypes = user?.typeCustom || []

    // Локальний порядок типів для drag-and-drop (синхронізується з даними користувача)
    const [orderedTypes, setOrderedTypes] = useState(userTypes)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    useEffect(() => {
        setOrderedTypes(user?.typeCustom || [])
    }, [user?.typeCustom])

    // Підставляємо поточне ім'я, коли дані користувача завантажились
    useEffect(() => {
        setFullName(user?.fullName || '')
    }, [user?.fullName])

    // Підставляємо поточну пошту
    useEffect(() => {
        setNewEmail(user?.email || '')
    }, [user?.email])

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

    const handleAvatarRemove = () => {
        alertConfirm('Are you sure you want to remove your photo?', async () => {
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
        })
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

    // -- EMAIL -- //
    const handleOpenEmailDialog = () => {
        setNewEmail(user?.email || '')
        setEmailPassword('')
        setEmailDialogOpen(true)
    }

    const handleCloseEmailDialog = () => {
        if (savingEmail) return
        setEmailDialogOpen(false)
    }

    const handleSaveEmail = async () => {
        const trimmed = newEmail.trim()
        if (!trimmed || trimmed === user?.email) return
        if (!emailPassword) {
            alertError(null, 'Password required', 'Enter your current password to change email')
            return
        }

        try {
            setSavingEmail(true)
            const { data } = await instance.patch('/auth/email', { email: trimmed, password: emailPassword })
            dispatch(updateUserData({ email: data.results.email }))
            setEmailPassword('')
            setEmailDialogOpen(false)
            alertSuccess('Email updated')
        } catch (err) {
            console.warn(err)
            alertError(err)
        } finally {
            setSavingEmail(false)
        }
    }

    // -- PASSWORD -- //
    const handleOpenPwdDialog = () => {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPwdDialogOpen(true)
    }

    const handleClosePwdDialog = () => {
        if (savingPassword) return
        setPwdDialogOpen(false)
    }

    const handleSavePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) return
        if (newPassword !== confirmPassword) {
            alertError(null, 'Passwords do not match', 'New password and confirmation must be the same')
            return
        }

        try {
            setSavingPassword(true)
            await instance.patch('/auth/password', { oldPassword, newPassword })
            setPwdDialogOpen(false)
            alertSuccess('Password updated')
        } catch (err) {
            console.warn(err)
            alertError(err)
        } finally {
            setSavingPassword(false)
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

    // Зміна порядку перетягуванням
    const handleDragEnd = (event) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        const oldIndex = orderedTypes.indexOf(active.id)
        const newIndex = orderedTypes.indexOf(over.id)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(orderedTypes, oldIndex, newIndex)
        setOrderedTypes(reordered)   // оптимістично оновлюємо UI
        saveTypes(reordered)         // зберігаємо новий порядок
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

                    {/* Remove button */}
                    {user?.avatar && (
                        <IconButton
                            onClick={handleAvatarRemove}
                            disabled={uploadingAvatar}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bgcolor: '#d33',
                                color: '#fff',
                                '&:hover': { bgcolor: '#b32020' },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
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
                        Tags
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Your personal tags for movies and TV shows.
                    </Typography>
                </Box>

                {/* Existing types — перетягуванням можна змінювати порядок */}
                {orderedTypes.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={orderedTypes} strategy={verticalListSortingStrategy}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {orderedTypes.map((type) => (
                                    <SortableTypeItem
                                        key={type}
                                        type={type}
                                        onDelete={() => handleDeleteType(type)}
                                    />
                                ))}
                            </Box>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        No tags yet.
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

            {/* LOGIN & SECURITY */}
            <Box sx={cardSx}>
                <Box>
                    <Typography variant="h6" sx={sectionTitleSx}>
                        Login & security
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Manage the email and password you use to sign in.
                    </Typography>
                </Box>

                {/* Email */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Email</Typography>
                        <Typography variant="body1" sx={{ color: 'text.main', wordBreak: 'break-word' }}>
                            {user?.email}
                        </Typography>
                    </Box>
                    <MainButton onClick={handleOpenEmailDialog} sx={{ m: 0 }}>
                        Change email
                    </MainButton>
                </Box>

                {/* Password */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Password</Typography>
                        <Typography variant="body1" sx={{ color: 'text.main' }}>
                            ••••••••
                        </Typography>
                    </Box>
                    <MainButton onClick={handleOpenPwdDialog} sx={{ m: 0 }}>
                        Change password
                    </MainButton>
                </Box>
            </Box>

            {/* EMAIL DIALOG */}
            <Dialog open={emailDialogOpen} onClose={handleCloseEmailDialog} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: 'bg.second', color: 'text.main', fontWeight: 700 }}>
                    Change email
                </DialogTitle>
                <DialogContent sx={{ bgcolor: 'bg.second', display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                    <LabeledInputBox
                        fullWidth
                        label="New email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                    />
                    <LabeledInputBox
                        fullWidth
                        label="Current password"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEmail() }}
                    />
                </DialogContent>
                <DialogActions sx={{ bgcolor: 'bg.second', p: 2, gap: 1 }}>
                    <MainButton
                        onClick={handleCloseEmailDialog}
                        disabled={savingEmail}
                        sx={{ m: 0, bgcolor: 'transparent', color: 'text.main', border: '1px solid', borderColor: 'text.secondary', ':hover': { bgcolor: 'bg.selected' } }}
                    >
                        Cancel
                    </MainButton>
                    <MainButton
                        onClick={handleSaveEmail}
                        disabled={!(newEmail.trim() && newEmail.trim() !== user?.email) || !emailPassword || savingEmail}
                        sx={{ m: 0 }}
                    >
                        {savingEmail ? 'Saving...' : 'Save'}
                    </MainButton>
                </DialogActions>
            </Dialog>

            {/* PASSWORD DIALOG */}
            <Dialog open={pwdDialogOpen} onClose={handleClosePwdDialog} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: 'bg.second', color: 'text.main', fontWeight: 700 }}>
                    Change password
                </DialogTitle>
                <DialogContent sx={{ bgcolor: 'bg.second', display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                    <LabeledInputBox
                        fullWidth
                        label="Current password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <LabeledInputBox
                        fullWidth
                        label="New password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <LabeledInputBox
                        fullWidth
                        label="Confirm new password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSavePassword() }}
                    />
                </DialogContent>
                <DialogActions sx={{ bgcolor: 'bg.second', p: 2, gap: 1 }}>
                    <MainButton
                        onClick={handleClosePwdDialog}
                        disabled={savingPassword}
                        sx={{ m: 0, bgcolor: 'transparent', color: 'text.main', border: '1px solid', borderColor: 'text.secondary', ':hover': { bgcolor: 'bg.selected' } }}
                    >
                        Cancel
                    </MainButton>
                    <MainButton
                        onClick={handleSavePassword}
                        disabled={!oldPassword || !newPassword || !confirmPassword || savingPassword}
                        sx={{ m: 0 }}
                    >
                        {savingPassword ? 'Saving...' : 'Save'}
                    </MainButton>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ProfilePage
