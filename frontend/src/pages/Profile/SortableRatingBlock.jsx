import { Box, IconButton, InputBase } from '@mui/material'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getContrastText } from '../../utils/ratingSystem'
import ColorSwatchPicker from './ColorSwatchPicker'

import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import CloseIcon from '@mui/icons-material/Close'

// Один перетягуваний блок системи оцінок: бейдж зі значенням + назва + скорочення + колір
//
// Розкладка. На десктопі — один рядок, елементи в порядку DOM.
// На телефоні шість елементів у рядок не влазять, тому вони перерозподіляються
// через flex `order` у два рядки:
//     [ручка] [назва.................................]
//     [колір] [значення] ........... [скорочення] [x]
// `order` дозволяє змінити тільки візуальний порядок, не чіпаючи DOM,
// тож десктопна розкладка лишається такою, якою була.
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
                // Розрив рядка — це елемент нульової висоти, який займає власний
                // «рядок». Половинимо вертикальний проміжок, щоб сумарно вийшло 8px.
                rowGap: { xs: '4px', sm: 1 },
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

            {/* Вибір кольору — на телефоні їде в нижній рядок, до лівого краю */}
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
                    order: { xs: 5, sm: 0 },
                    // Відштовхує скорочення й хрестик до правого краю
                    mr: { xs: 'auto', sm: 0 },
                }}
            >
                {value}
            </Box>

            {/* Назва блоку — на телефоні забирає решту першого рядка */}
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

            {/* Розрив рядка — тільки на телефоні */}
            <Box sx={{ flexBasis: '100%', height: 0, order: 3, display: { xs: 'block', sm: 'none' } }} />

            {/* Скорочення (2 букви) */}
            <InputBase
                value={abbr}
                onChange={(e) => onAbbrChange(e.target.value.toUpperCase())}
                placeholder="AB"
                inputProps={{ maxLength: 2, style: { textAlign: 'center', textTransform: 'uppercase' } }}
                sx={{
                    flexShrink: 0, width: 44, height: 32, px: '4px', borderRadius: 1,
                    bgcolor: 'bg.second', color: 'text.main', fontWeight: 700,
                    order: { xs: 6, sm: 0 },
                }}
            />

            {/* Видалити блок */}
            <IconButton
                size="small"
                onClick={onDelete}
                disabled={!canDelete}
                sx={{
                    flexShrink: 0,
                    color: 'text.secondary',
                    order: { xs: 7, sm: 0 },
                    '&:hover': { color: '#d33' },
                }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    )
}

export default SortableRatingBlock
