import { Box, IconButton, Typography } from '@mui/material'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'

// Один перетягуваний рядок кастомного типу
function SortableTypeItem({ type, onRename, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: type })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                bgcolor: 'yellow.main',
                color: 'text.dark',
                boxShadow: isDragging ? 4 : 0,
                opacity: isDragging ? 0.9 : 1,
                zIndex: isDragging ? 1 : 'auto',
            }}
        >
            {/* Ручка перетягування */}
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'grab',
                    touchAction: 'none',
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <DragIndicatorIcon fontSize="small" sx={{ color: 'text.dark', opacity: 0.6 }} />
            </Box>

            <Typography
                variant="body2"
                noWrap
                title={type}
                sx={{ flexGrow: 1, minWidth: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
                {type}
            </Typography>

            <IconButton
                size="small"
                onClick={onRename}
                sx={{ color: 'text.dark', '&:hover': { color: 'text.main' } }}
            >
                <EditIcon fontSize="small" />
            </IconButton>

            <IconButton
                size="small"
                onClick={onDelete}
                sx={{ color: 'text.dark', '&:hover': { color: '#d33' } }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    )
}

export default SortableTypeItem
