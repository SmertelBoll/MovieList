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
 * Батьківська картка має бути position: relative. Посилання має z-index 1: у картках
 * є позиціоновані елементи (напр. постер з position: relative), які без цього лягали б
 * поверх нього й перехоплювали клік. Кнопки всередині картки мають бути в DOM ПІЗНІШЕ
 * за посилання й теж мати zIndex ≥ 1 — тоді вони лишаються над ним.
 */
function StretchedLink({ to, label }) {
    return (
        <Box
            component={Link}
            to={to}
            aria-label={label}
            sx={{ position: 'absolute', inset: 0, zIndex: 1, display: 'block', borderRadius: 'inherit' }}
        />
    )
}

export default StretchedLink
