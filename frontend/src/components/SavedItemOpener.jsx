import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectSavedCopies } from '../redux/slices/SavedSlice'
import useFolderPicker from '../hooks/useFolderPicker'

// Opens a movie/tv by one rule (posters on Updates): no copy -> TMDB page; one copy -> saved page; several -> folder
// picker.
// A real link, so Ctrl/Cmd+click and middle click open a new tab (several copies: the TMDB page, which lists all
// folders).
// A plain click stops propagation so it doesn't expand the row.
function SavedItemOpener({ mediaType, tmdbId, title, sx, children }) {
    const navigate = useNavigate()
    const copies = useSelector(selectSavedCopies(mediaType, tmdbId))
    const [pickFolder, pickerDialog] = useFolderPicker()

    const href = copies.length === 1 ? `/user/${mediaType}/${copies[0].mongoId}` : `/${mediaType}/${tmdbId}`

    const handleClick = async (e) => {
        e.stopPropagation()
        // Ctrl/Cmd/Shift/Alt + click: leave it to the browser (new tab/window). A middle click fires auxclick
        // and never reaches here.
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
            sx={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none', ...sx }}
        >
            {children}
            {pickerDialog}
        </Box>
    )
}

export default SavedItemOpener
