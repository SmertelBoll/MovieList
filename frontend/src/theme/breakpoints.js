const breakpoints = {
    values: {
        xs: 0,       // Найменший breakpoint
        sm: 600,     // Маленькі екрани
        md: 960,     // Середні екрани
        lg: 1280,    // Великі екрани
        xl: 1920,    // Дуже великі екрани
        xxl: 2560,   // Кастомний розмір екрану
        xxxl: 3840,  // Ще більший кастомний розмір екрану
    },

    up: (key) => `@media (min-width:${breakpoints.values[key]}px)`,
    down: (key) => `@media (max-width:${breakpoints.values[key] - 1}px)`,
    between: (start, end) => `@media (min-width:${breakpoints.values[start]}px) and (max-width:${breakpoints.values[end] - 1}px)`,
    only: (key) => `@media (min-width:${breakpoints.values[key]}px) and (max-width:${breakpoints.values[key + 1] - 1}px)`,
    width: (key) => `${breakpoints.values[key]}px`,
};

export default breakpoints;

