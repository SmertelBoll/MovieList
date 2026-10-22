import { Box, ButtonBase, Typography } from '@mui/material'

const PADDING = 4

export const SLIDE_MS = 300

// Slider switch with a yellow thumb. Two options: a click anywhere flips to the other; more: a click picks the option.
// compact = narrower; give icon labels an ariaLabel.
function SegmentedSwitch({ options, value, onChange, sx, compact = false }) {
    const index = Math.max(0, options.findIndex((o) => o.value === value))
    const isToggle = options.length === 2
    const handleToggle = () => onChange(options[1 - index].value)

    return (
        <Box
            role="tablist"
            // Toggle: a click anywhere (even on the selected side) flips to the other; clicks on option
            // buttons bubble up to here.
            onClick={isToggle ? handleToggle : undefined}
            sx={{
                cursor: 'pointer',
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: `repeat(${options.length}, 1fr)`,
                p: `${PADDING}px`,
                borderRadius: 4,
                // The track is noticeably darker than the page (bg.second) in both themes so the thumb reads.
                bgcolor: 'bg.selected',
                ...sx,
            }}
        >
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
                    // will-change puts the thumb on the GPU so page load (list reload) doesn't stutter it.
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
                        aria-label={option.ariaLabel}
                        // No ripple: the whole switch handles the click and the thumb already shows the
                        // change.
                        disableRipple
                        onClick={isToggle ? undefined : () => onChange(option.value)}
                        sx={{
                            position: 'relative',
                            px: compact ? 1.5 : 3,
                            py: compact ? 0 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            ...(compact && { height: 32 }),
                            borderRadius: 3,
                            color: selected ? 'yellow.contrastText' : 'text.main',
                            transition: `color ${SLIDE_MS}ms ease-in-out`,
                        }}
                    >
                        {/* Text goes through Typography; an icon (not a string) stays as is: inside Typography it took the text line height and hung unevenly. */}
                        {typeof option.label === 'string'
                            ? <Typography variant="button" sx={{ color: 'inherit' }}>{option.label}</Typography>
                            : option.label}
                    </ButtonBase>
                )
            })}
        </Box>
    )
}

export default SegmentedSwitch
