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
 * Це не посилання, а кліковий елемент: усі кліки (звичайний, Ctrl, колесо) поводяться однаково.
 * Клік не спливає вище, тож не розгортає рядок, у якому лежить.
 */
function SavedItemOpener({ mediaType, tmdbId, title, sx, children }) {
    const navigate = useNavigate()
    const copies = useSelector(selectSavedCopies(mediaType, tmdbId))
    const [pickFolder, pickerDialog] = useFolderPicker()

    const handleClick = async (e) => {
        e.stopPropagation()
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
        <Box onClick={handleClick} sx={{ cursor: 'pointer', ...sx }}>
            {children}
            {pickerDialog}
        </Box>
    )
}

export default SavedItemOpener
