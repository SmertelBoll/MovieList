import { useCallback, useMemo, useState } from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextFieldCustom from './TextFieldCustom'
import MainButton from '../Buttons/MainButton'

// Text input dialog instead of a swal2 input. Returns [prompt, dialog]: prompt(options) -> Promise<string|null> (null =
// cancelled); render dialog in the tree.
function useTextPrompt() {
    const theme = useTheme()
    const isFullScreen = useMediaQuery(theme.breakpoints.down('sm'))

    // Regular field height: with a floating label the caption would otherwise shift.
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main),
        [theme.palette.bg.second, theme.palette.text.main]
    )

    const [config, setConfig] = useState(null)
    const [value, setValue] = useState('')
    const [error, setError] = useState('')

    const prompt = useCallback((options = {}) => (
        new Promise((resolve) => {
            setValue(options.initialValue || '')
            setError('')
            setConfig({ ...options, resolve })
        })
    ), [])

    const settle = (result) => {
        config?.resolve(result)
        setConfig(null)
        setError('')
    }

    const handleConfirm = () => {
        const trimmed = value.trim()
        if (!trimmed) {
            setError('Please enter a value')
            return
        }
        settle(trimmed)
    }

    const dialog = (
        <Dialog
            open={Boolean(config)}
            onClose={() => settle(null)}
            fullWidth
            maxWidth="xs"
            fullScreen={isFullScreen}
        >
            <DialogTitle sx={{ bgcolor: 'bg.second', color: 'text.main', fontWeight: 700 }}>
                {config?.title || 'Enter value'}
            </DialogTitle>

            <DialogContent sx={{ bgcolor: 'bg.second', display: 'flex', flexDirection: 'column', gap: 2, pt: (t) => `${t.spacing(1)} !important` }}>
                <InputBox
                    fullWidth
                    autoFocus
                    label={config?.label || ''}
                    placeholder={config?.placeholder || ''}
                    value={value}
                    error={Boolean(error)}
                    helperText={error || ' '}
                    inputProps={{ maxLength: config?.maxLength ?? 100 }}
                    onChange={(e) => {
                        setValue(e.target.value)
                        if (error) setError('')
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            handleConfirm()
                        }
                    }}
                />
            </DialogContent>

            <DialogActions
                sx={{
                    bgcolor: 'bg.second',
                    gap: 1,
                    px: 2,
                    pt: 1.5,
                    pb: 2,
                    borderTop: { xs: '1px solid', md: 'none' },
                    borderColor: 'divider',
                }}
            >
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
                <MainButton
                    onClick={handleConfirm}
                    sx={{ m: 0, flex: { xs: 1, sm: '0 0 auto' } }}
                >
                    {config?.confirmLabel || 'Save'}
                </MainButton>
            </DialogActions>
        </Dialog>
    )

    return [prompt, dialog]
}

export default useTextPrompt
