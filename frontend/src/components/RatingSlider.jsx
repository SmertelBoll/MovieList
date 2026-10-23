import { Box, Slider } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'

// Width of the slider below which marks every 10 get crowded (11 labels need ~38px each): then every 20.
const MIN_WIDTH_FOR_TENS = 380

const buildMarks = (step) => Array.from({ length: 100 / step + 1 }, (_, i) => ({ value: step * i, label: step * i }))
const MARKS_TENS = buildMarks(10)
const MARKS_TWENTIES = buildMarks(20)

// The one rating slider on the site (0-100) with an optional field next to it (children). Color comes from the
// theme text color, so the thumb and track turn light in the dark theme.
function RatingSlider({ value, onChange, children, sx }) {
    const sliderBox = useRef(null)
    const [isCompact, setIsCompact] = useState(false)

    useEffect(() => {
        const node = sliderBox.current
        if (!node || typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver(([entry]) => setIsCompact(entry.contentRect.width < MIN_WIDTH_FOR_TENS))
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const marks = useMemo(() => (isCompact ? MARKS_TWENTIES : MARKS_TENS), [isCompact])

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 3, md: 5 }, pt: 2, pl: 1, ...sx }}>
            <Box ref={sliderBox} sx={{ flexGrow: 1, minWidth: 0 }}>
                <Slider
                    value={value}
                    onChange={onChange}
                    min={0}
                    max={100}
                    step={1}
                    marks={marks}
                    valueLabelDisplay="auto"
                    sx={{ color: 'text.main', display: 'block' }}
                />
            </Box>
            {children}
        </Box>
    )
}

export default RatingSlider
