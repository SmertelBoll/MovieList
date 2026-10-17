import { Box, ButtonBase, Typography } from '@mui/material'

const PADDING = 4 // px: однаковий відступ повзунка з усіх боків

// Тривалість ковзання повзунка, мс
export const SLIDE_MS = 300

/**
 * Перемикач-слайдер: кілька однакової ширини варіантів і жовтий повзунок, що ковзає під обраним.
 *
 * Для двох варіантів клік у БУДЬ-ЯКЕ місце перемикача обирає протилежний
 * (як перемикач-тумблер); для більшої кількості — клік по варіанту обирає його.
 *
 * options: [{ value, label }]; value — обраний value; onChange(value).
 * Усі варіанти однакової ширини, тож повзунок — це просто translateX на n × 100%.
 * Колір: жовтий фон → темний текст (правило сайту), решта — звичайний текст теми.
 */
function SegmentedSwitch({ options, value, onChange, sx }) {
    const index = Math.max(0, options.findIndex((o) => o.value === value))
    const isToggle = options.length === 2
    const handleToggle = () => onChange(options[1 - index].value)

    return (
        <Box
            role="tablist"
            // Тумблер: клік куди завгодно (в тому числі по вже обраному боці) перемикає на інший.
            // Клік по кнопці-варіанту сюди теж спливає, тож окремий обробник їм не потрібен.
            onClick={isToggle ? handleToggle : undefined}
            sx={{
                cursor: 'pointer',
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: `repeat(${options.length}, 1fr)`,
                p: `${PADDING}px`,
                borderRadius: 4,
                // Доріжка помітно темніша за фон сторінки (bg.second) в обох темах — повзунок читається
                bgcolor: 'bg.selected',
                ...sx,
            }}
        >
            {/* Повзунок: ширина одного варіанта, зсув — на індекс обраного */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    top: PADDING,
                    bottom: PADDING,
                    left: PADDING,
                    width: `calc((100% - ${PADDING * 2}px) / ${options.length})`,
                    borderRadius: 3,
                    bgcolor: 'yellow.main',
                    transform: `translateX(${index * 100}%)`,
                    // Плавне ковзання; will-change виносить повзунок на GPU, щоб навантаження
                    // на сторінці (перезавантаження списку) його не гальмувало
                    transition: `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    willChange: 'transform',
                }}
            />

            {options.map((option) => {
                const selected = option.value === value
                return (
                    <ButtonBase
                        key={option.value}
                        role="tab"
                        aria-selected={selected}
                        // Без хвилі від кліку: клік обробляє весь перемикач, а повзунок і так показує зміну
                        disableRipple
                        onClick={isToggle ? undefined : () => onChange(option.value)}
                        sx={{
                            position: 'relative',
                            px: 3,
                            py: 1,
                            borderRadius: 3,
                            // Над повзунком; колір міняється разом з ковзанням
                            color: selected ? 'yellow.contrastText' : 'text.main',
                            transition: `color ${SLIDE_MS}ms ease-in-out`,
                        }}
                    >
                        <Typography variant="button" sx={{ color: 'inherit' }}>
                            {option.label}
                        </Typography>
                    </ButtonBase>
                )
            })}
        </Box>
    )
}

export default SegmentedSwitch
