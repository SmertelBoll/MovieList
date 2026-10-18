import { Box } from '@mui/material'

/**
 * Кружечок кольору рівня власної системи оцінок (для випадайок оцінки).
 * Рівень без кольору — порожнє кільце. Обгортка 24×24 збігається з розміром іконок MUI в пунктах меню,
 * тож підписи вирівняні однаково незалежно від того, кружечок це чи іконка.
 */
function RatingDot({ color, size = 14 }) {
    return (
        <Box sx={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    bgcolor: color || 'transparent',
                    // Без кольору — контур, щоб пункт не виглядав порожнім; з кольором — тонка рамка для світлих відтінків
                    border: '1px solid',
                    borderColor: color ? 'rgba(0,0,0,0.25)' : 'text.secondary',
                }}
            />
        </Box>
    )
}

export default RatingDot
