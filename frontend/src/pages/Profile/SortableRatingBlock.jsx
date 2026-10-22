import { Box, IconButton, InputBase } from '@mui/material'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getContrastText } from '../../utils/ratingSystem'
import ColorSwatchPicker from './ColorSwatchPicker'

import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import CloseIcon from '@mui/icons-material/Close'

// One row on desktop; on phones flex `order` rearranges the six items into two rows ([handle][name] /
// [color][value]...[abbr][x]) without touching the DOM order.
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
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: 1,
                // A line break is a zero-height element taking its own "row"; the vertical gap is halved so
                // the total is 8px.
                rowGap: { xs: '4px', sm: 1 },
                px: 1,
                py: 0.75,
                borderRadius: 2,
                bgcolor: 'bg.main',
                boxShadow: isDragging ? 4 : 0,
                opacity: isDragging ? 0.9 : 1,
                zIndex: isDragging ? 1 : 'auto',
            }}
        >
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    cursor: 'grab',
                    touchAction: 'none',
                    color: 'text.secondary',
                    order: { xs: 1, sm: 0 },
                    '&:active': { cursor: 'grabbing' },
                }}
            >
                <DragIndicatorIcon fontSize="small" />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    order: { xs: 4, sm: 0 },
                }}
            >
                <ColorSwatchPicker color={color} onChange={onColorChange} />
            </Box>

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
                    order: { xs: 5, sm: 0 },
                    mr: { xs: 'auto', sm: 0 },
                }}
            >
                {value}
            </Box>

            <InputBase
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Level name..."
                inputProps={{ maxLength: 50 }}
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    color: 'text.main',
                    fontWeight: 600,
                    order: { xs: 2, sm: 0 },
                }}
            />

            <Box sx={{ flexBasis: '100%', height: 0, order: 3, display: { xs: 'block', sm: 'none' } }} />

            <InputBase
                value={abbr}
                onChange={(e) => onAbbrChange(e.target.value.toUpperCase())}
                placeholder="AB"
                inputProps={{ maxLength: 2, style: { textAlign: 'center', textTransform: 'uppercase' } }}
                sx={{
                    flexShrink: 0, width: 44, height: 32, px: 0.5, borderRadius: 1,
                    bgcolor: 'bg.second', color: 'text.main', fontWeight: 700,
                    order: { xs: 6, sm: 0 },
                }}
            />

            <IconButton
                size="small"
                onClick={onDelete}
                disabled={!canDelete}
                sx={{
                    flexShrink: 0,
                    color: 'text.secondary',
                    order: { xs: 7, sm: 0 },
                    '@media (hover: hover) and (pointer: fine)': { '&:hover': { color: 'danger.main' } },
                }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    )
}

export default SortableRatingBlock
