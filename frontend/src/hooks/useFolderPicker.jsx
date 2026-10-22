import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import FolderIcon from '@mui/icons-material/Folder'
import MainButton from '../components/Buttons/MainButton'
import { getStatusChipSx, getStatusLabel } from '../utils/folderStatus'

const ICON_SIZE = { xs: '4rem', sm: '5rem' }

// Picks one of the folders holding a movie/tv (its copies). Returns [pick, dialog]: pick({ copies, title, subtitle })
// -> Promise<copy | null>.
function useFolderPicker() {
    const theme = useTheme()
    const navigate = useNavigate()
    const isFullScreen = useMediaQuery(theme.breakpoints.down('sm'))

    const [config, setConfig] = useState(null)

    const pick = useCallback((options = {}) => {
        const copies = options.copies || []
        if (copies.length <= 1) return Promise.resolve(copies[0] || null)
        return new Promise((resolve) => setConfig({ ...options, resolve }))
    }, [])

    const settle = (result) => {
        config?.resolve(result)
        setConfig(null)
    }

    const folderTiles = useMemo(() => {
        const byFolder = new Map()
        for (const copy of config?.copies || []) {
            const tile = byFolder.get(copy.folderName) || { ...copy, copies: [] }
            tile.copies.push(copy)
            byFolder.set(copy.folderName, tile)
        }
        return [...byFolder.values()]
    }, [config])

    const handleTileClick = (tile) => {
        if (tile.copies.length === 1) {
            settle(tile.copies[0])
            return
        }
        const filter = config?.filterText ? `?filter=${encodeURIComponent(config.filterText)}` : ''
        settle(null)
        navigate(`/folders/${encodeURIComponent(tile.folderName)}${filter}`)
    }

    const dialog = (
        <Dialog
            open={Boolean(config)}
            onClose={() => settle(null)}
            fullWidth
            maxWidth="md"
            fullScreen={isFullScreen}
            disableEnforceFocus
            // The dialog opens from a card: the click must not pass through it.
            onClick={(e) => e.stopPropagation()}
        >
            <DialogTitle sx={{ bgcolor: 'bg.second', color: 'text.main', pb: 0 }}>
                <Typography variant="p" component="div" sx={{ textAlign: 'left' }}>
                    {config?.title || 'Choose a folder'}
                </Typography>
                {config?.subtitle && (
                    <Typography variant="body2" sx={{ color: 'text.second' }}>
                        {config.subtitle}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent
                sx={{
                    bgcolor: 'bg.second',
                    minHeight: { xs: 'auto', md: 450 },
                    maxHeight: { xs: 'none', md: 450 },
                    pt: 2,
                }}
            >
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fill, minmax(150px, 1fr))' },
                    gap: { xs: 1, sm: 2 },
                    pt: 1,
                }}>
                    {folderTiles.map((tile) => (
                        <Box
                            key={tile.folderName}
                            onClick={() => handleTileClick(tile)}
                            sx={{
                                minWidth: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.5,
                                p: 1,
                                borderRadius: 2,
                                cursor: 'pointer',
                                color: 'text.main',
                                transition: 'background-color 0.15s, transform 0.15s',
                                '@media (hover: hover) and (pointer: fine)': { '&:hover': {
                                    transform: (t) => t.hoverLift,
                                    bgcolor: 'yellow.main',
                                    color: 'yellow.contrastText',
                                    '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                    '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                } },
                            }}
                        >
                            {tile.image ? (
                                <Box
                                    component="img"
                                    src={tile.image}
                                    alt={tile.folderName}
                                    sx={{
                                        width: ICON_SIZE,
                                        height: ICON_SIZE,
                                        maxWidth: '100%',
                                        objectFit: 'cover',
                                        borderRadius: 2,
                                    }}
                                />
                            ) : (
                                <FolderIcon sx={{ fontSize: ICON_SIZE, color: 'text.main' }} />
                            )}
                            <Typography
                                variant="body2"
                                textAlign="center"
                                sx={{ wordBreak: 'break-word', color: 'text.main' }}
                            >
                                {tile.folderName}
                            </Typography>
                            <Chip
                                size="small"
                                label={getStatusLabel(tile.status)}
                                sx={{ ...getStatusChipSx(tile.status), height: 22, maxWidth: '100%' }}
                            />
                        </Box>
                    ))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ bgcolor: 'bg.second', p: 2 }}>
                <MainButton
                    onClick={() => settle(null)}
                    sx={{
                        m: 0,
                        flex: { xs: 1, sm: '0 0 auto' },
                        bgcolor: 'transparent',
                        color: 'text.main',
                        border: '1px solid',
                        borderColor: 'text.secondary',
                        '@media (hover: hover) and (pointer: fine)': { ':hover': { bgcolor: 'bg.selected' } },
                    }}
                >
                    Cancel
                </MainButton>
            </DialogActions>
        </Dialog>
    )

    return [pick, dialog]
}

export default useFolderPicker
