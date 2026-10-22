import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectSavedCopies } from '../redux/slices/SavedSlice'
import useFolderPicker from '../hooks/useFolderPicker'

/**
 * Обгортка, клік по якій відкриває фільм чи серіал — єдина логіка для всіх таких місць (постери на Updates):
 *   немає збереженої копії -> сторінка TMDB (/movie|tv/:tmdbId);
 *   одна копія             -> збережена сторінка (/user/movie|tv/:mongoId);
 *   кілька копій (папок)   -> вікно вибору папки: одна копія в папці — відкриваємо її,
 *                             кілька в одній папці — папка з пошуком за назвою (це робить сам useFolderPicker).
 *
 * Це справжнє посилання (<a href>), тому Ctrl/Cmd+клік і колесо миші відкривають сторінку в новій вкладці. Адреса
 * та сама, куди веде звичайний клік, — щоб Ctrl+клік не відкривав щось інше, ніж просто клік (з цього ми колись
 * відмовились від посилання, поки його адреса була незалежна від логіки кліку). Єдиний виняток — кілька копій:
 * одного адресата немає (звичайний клік питає, яку папку відкрити), тому в новій вкладці відкриється сторінка
 * TMDB, де видно всі папки фільму.
 * Звичайний клік не спливає вище, тож не розгортає рядок, у якому лежить.
 */
function SavedItemOpener({ mediaType, tmdbId, title, sx, children }) {
    const navigate = useNavigate()
    const copies = useSelector(selectSavedCopies(mediaType, tmdbId))
    const [pickFolder, pickerDialog] = useFolderPicker()

    // Куди веде посилання без вибору папки
    const href = copies.length === 1 ? `/user/${mediaType}/${copies[0].mongoId}` : `/${mediaType}/${tmdbId}`

    const handleClick = async (e) => {
        e.stopPropagation()
        // Ctrl / Cmd / Shift / Alt + клік: лишаємо поведінку браузера (нова вкладка чи вікно). Колесо миші сюди не доходить —
        // браузер сам відкриває посилання (подія auxclick), а клік рядка не спрацьовує.
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        if (copies.length === 0) {
            navigate(`/${mediaType}/${tmdbId}`)
        } else if (copies.length === 1) {
            navigate(`/user/${mediaType}/${copies[0].mongoId}`)
        } else {
            const copy = await pickFolder({ copies, title: 'Open in which folder?', subtitle: title, filterText: title })
            if (copy) navigate(`/user/${mediaType}/${copy.mongoId}`)
        }
    }

    return (
        <Box
            component="a"
            href={href}
            onClick={handleClick}
            aria-label={title}
            // Посилання не повинно виглядати як текст-посилання: у ньому лише постер
            sx={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none', ...sx }}
        >
            {children}
            {pickerDialog}
        </Box>
    )
}

export default SavedItemOpener
