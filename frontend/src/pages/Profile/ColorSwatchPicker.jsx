import { useState } from 'react'
import { Box, Divider, Popover } from '@mui/material'
import { HexColorPicker, HexColorInput } from 'react-colorful'

// Насичена, але світла палітра: яскравість кожного кольору тримається вище 0.6,
// тож getContrastText завжди дає темний текст (читабельно на сітці оцінок)
const PALETTE = [
    '#ff7b6b', '#ff7eb0', '#c58af0', '#8fa0f5', '#6db8f5', '#4fd1e3',
    '#43ceb9', '#7ed48a', '#c3e34f', '#ffd240', '#ffb040', '#ff9166',
    '#d19a7a', '#e0c9a0', '#c4c4c4', '#a0a0a0',
]

// УВАГА: theme.spacing — масив, тож дробові значення (p: 1.5, gap: 0.75) дають undefined
// і відступ просто зникає. Тут усі відступи задані явними px.
function ColorSwatchPicker({ color, onChange }) {
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const current = color || '#cccccc'
    const selected = (color || '').toLowerCase()

    return (
        <>
            {/* Поточний колір / "?" — клік відкриває пікер */}
            <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                title="Pick color"
                sx={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '6px',
                    bgcolor: color || 'bg.second',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    fontWeight: 700,
                    fontSize: 13,
                    lineHeight: 1,
                    transition: 'transform 0.12s, box-shadow 0.12s',
                    '&:hover': { transform: 'scale(1.08)', boxShadow: 2 },
                }}
            >
                {!color && '?'}
            </Box>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: '6px',
                            bgcolor: 'bg.second',
                            backgroundImage: 'none',
                            borderRadius: '14px',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 4,
                            overflow: 'hidden',
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        boxSizing: 'border-box',
                        width: 232,
                        p: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        // Стилі для react-colorful (бібліотека жорстко задає 200x200)
                        '& .react-colorful': { width: '100%', height: 168 },
                        '& .react-colorful__saturation': {
                            borderRadius: '10px',
                            border: 'none',
                            marginBottom: '12px',
                        },
                        '& .react-colorful__hue': { height: 14, borderRadius: '7px' },
                        '& .react-colorful__pointer': { width: 18, height: 18, borderWidth: 2 },
                        '& .react-colorful__hue .react-colorful__pointer': { width: 16, height: 16 },
                    }}
                >
                    {/* Градієнтний пікер (плавне перетягування мишкою) */}
                    <HexColorPicker color={current} onChange={onChange} />

                    {/* Поле для коду кольору */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                bgcolor: current,
                                border: '1px solid',
                                borderColor: 'divider',
                                flexShrink: 0,
                            }}
                        />
                        <Box
                            component={HexColorInput}
                            prefixed
                            color={current}
                            onChange={onChange}
                            sx={{
                                boxSizing: 'border-box',
                                flexGrow: 1,
                                minWidth: 0,
                                height: 32,
                                px: 1,
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'bg.main',
                                color: 'text.main',
                                fontFamily: 'monospace',
                                fontSize: 14,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                                outline: 'none',
                                transition: 'border-color 0.12s',
                                '&:focus': { borderColor: 'text.secondary' },
                            }}
                        />
                    </Box>

                    <Divider sx={{ mx: '-14px' }} />

                    {/* Швидкі кольори */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
                        {PALETTE.map((c) => (
                            <Box
                                key={c}
                                onClick={() => onChange(c)}
                                title={c}
                                sx={(theme) => ({
                                    width: '100%',
                                    aspectRatio: '1 / 1',
                                    borderRadius: '50%',
                                    bgcolor: c,
                                    cursor: 'pointer',
                                    boxShadow:
                                        selected === c
                                            ? `0 0 0 2px ${theme.palette.bg.second}, 0 0 0 4px ${theme.palette.text.main}`
                                            : 'inset 0 0 0 1px rgba(0,0,0,0.2)',
                                    transition: 'transform 0.12s',
                                    '&:hover': { transform: 'scale(1.15)' },
                                })}
                            />
                        ))}
                    </Box>
                </Box>
            </Popover>
        </>
    )
}

export default ColorSwatchPicker
