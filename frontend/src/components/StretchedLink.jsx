import { Box } from '@mui/material'
import { Link } from 'react-router-dom'

/**
 * Невидиме посилання на всю картку («stretched link»).
 *
 * Картки в проєкті не можуть бути одним <a>: усередині є кнопки (додати в папку тощо),
 * а кнопка в посиланні — вкладена інтерактивність. Тому картка лишається div, а посилання
 * розтягується на неї поверх контенту. Так працюють звичайний клік, колесо миші та
 * Ctrl/Cmd+клік (нова вкладка), чого не дає onClick з navigate().
 *
 * Батьківська картка має бути position: relative. Кнопки всередині картки мають
 * zIndex ≥ 1, щоб лишатися над посиланням.
 */
function StretchedLink({ to, label }) {
    return (
        <Box
            component={Link}
            to={to}
            aria-label={label}
            sx={{ position: 'absolute', inset: 0, zIndex: 0, display: 'block', borderRadius: 'inherit' }}
        />
    )
}

export default StretchedLink
