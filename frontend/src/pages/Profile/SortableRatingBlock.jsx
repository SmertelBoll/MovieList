import { Box, IconButton, InputBase } from '@mui/material'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getContrastText } from '../../utils/ratingSystem'
import ColorSwatchPicker from './ColorSwatchPicker'

import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import CloseIcon from '@mui/icons-material/Close'

// Один перетягуваний блок системи оцінок: бейдж зі значенням + назва + скорочення + колір
function SortableRatingBlock({ id, name, abbr, color, value, onNameChange, onAbbrChange, onColorChange, onDelete, canDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

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
                py: '6px',
                borderRadius: 2,
                bgcolor: 'bg.main',
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
                    color: 'text.secondary',
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <DragIndicatorIcon fontSize="small" />
            </Box>

            {/* Вибір кольору з палітри */}
            <ColorSwatchPicker color={color} onChange={onColorChange} />

            {/* Значення оцінки (у кольорі рівня) */}
            <Box
                sx={{
                    flexShrink: 0,
                    minWidth: 44,
                    height: 32,
                    px: 1,
                    borderRadius: 1.5,
                    bgcolor: color || 'yellow.main',
                    color: color ? getContrastText(color) : 'text.dark',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {value}
            </Box>

            {/* Назва блоку */}
            <InputBase
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Level name..."
                inputProps={{ maxLength: 50 }}
                sx={{ flexGrow: 1, minWidth: 0, color: 'text.main', fontWeight: 600 }}
            />

            {/* Скорочення (2 букви) */}
            <InputBase
                value={abbr}
                onChange={(e) => onAbbrChange(e.target.value.toUpperCase())}
                placeholder="AB"
                inputProps={{ maxLength: 2, style: { textAlign: 'center', textTransform: 'uppercase' } }}
                sx={{
                    flexShrink: 0, width: 44, px: '4px', borderRadius: 1,
                    bgcolor: 'bg.second', color: 'text.main', fontWeight: 700,
                }}
            />

            {/* Видалити блок */}
            <IconButton
                size="small"
                onClick={onDelete}
                disabled={!canDelete}
                sx={{ color: 'text.secondary', '&:hover': { color: '#d33' } }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    )
}

export default SortableRatingBlock
