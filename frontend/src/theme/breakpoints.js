const breakpoints = {
    values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
        xxl: 2560,
        xxxl: 3840,
    },

    up: (key) => `@media (min-width:${breakpoints.values[key]}px)`,
    down: (key) => `@media (max-width:${breakpoints.values[key] - 1}px)`,
    between: (start, end) => `@media (min-width:${breakpoints.values[start]}px) and (max-width:${breakpoints.values[end] - 1}px)`,
    only: (key) => `@media (min-width:${breakpoints.values[key]}px) and (max-width:${breakpoints.values[key + 1] - 1}px)`,
    width: (key) => `${breakpoints.values[key]}px`,
};

export default breakpoints;

