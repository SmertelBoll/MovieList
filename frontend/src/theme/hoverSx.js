// Shared hover styles. Only for devices with a real pointer: on touch a tap would leave the card "hovered".
const HOVER_MEDIA = '@media (hover: hover) and (pointer: fine)'

// The card rises; shadow (a theme shadow index) is optional.
export const liftHoverSx = (shadow) => ({
    [HOVER_MEDIA]: {
        '&:hover': {
            transform: (theme) => theme.hoverLift,
            ...(shadow && { boxShadow: shadow }),
        },
    },
})

// The card rises and turns yellow; everything inside turns dark (yellow is light in every theme).
export const yellowHoverSx = {
    [HOVER_MEDIA]: {
        '&:hover': {
            transform: (theme) => theme.hoverLift,
            bgcolor: 'yellow.main',
            color: 'yellow.contrastText',
            '& .MuiTypography-root': { color: 'yellow.contrastText' },
            '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
        },
    },
}
