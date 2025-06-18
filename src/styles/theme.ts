import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";

// Define color palette
const palette = {
    primary: {
        main: "#006D77",
        light: "#83C5BE",
        dark: "#004E59",
        contrastText: "#FFFFFF",
    },
    secondary: {
        main: "#E29578",
        light: "#FFDDD2",
        dark: "#B06B4F",
        contrastText: "#FFFFFF",
    },
    error: {
        main: "#D32F2F",
        light: "#EF5350",
        dark: "#C62828",
    },
    warning: {
        main: "#ED6C02",
        light: "#FF9800",
        dark: "#E65100",
    },
    info: {
        main: "#0288D1",
        light: "#03A9F4",
        dark: "#01579B",
    },
    success: {
        main: "#2E7D32",
        light: "#4CAF50",
        dark: "#1B5E20",
    },
    grey: {
        50: "#FAFAFA",
        100: "#F5F5F5",
        200: "#EEEEEE",
        300: "#E0E0E0",
        400: "#BDBDBD",
        500: "#9E9E9E",
        600: "#757575",
        700: "#616161",
        800: "#424242",
        900: "#212121",
    },
    text: {
        primary: "#212121",
        secondary: "#757575",
        disabled: "#9E9E9E",
    },
    background: {
        default: "#FFFFFF",
        paper: "#F5F5F5",
    },
    divider: "#E0E0E0",
};

// Define typography
const typography = {
    fontFamily: [
        "Roboto",
        "Arial",
        "sans-serif",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        '"Helvetica Neue"',
        "sans-serif",
    ].join(","),
    h1: {
        fontWeight: 700,
        fontSize: "2.5rem",
        lineHeight: 1.2,
    },
    h2: {
        fontWeight: 700,
        fontSize: "2rem",
        lineHeight: 1.2,
    },
    h3: {
        fontWeight: 600,
        fontSize: "1.75rem",
        lineHeight: 1.2,
    },
    h4: {
        fontWeight: 600,
        fontSize: "1.5rem",
        lineHeight: 1.2,
    },
    h5: {
        fontWeight: 600,
        fontSize: "1.25rem",
        lineHeight: 1.2,
    },
    h6: {
        fontWeight: 600,
        fontSize: "1rem",
        lineHeight: 1.2,
    },
    subtitle1: {
        fontWeight: 500,
        fontSize: "1rem",
        lineHeight: 1.5,
    },
    subtitle2: {
        fontWeight: 500,
        fontSize: "0.875rem",
        lineHeight: 1.5,
    },
    body1: {
        fontWeight: 400,
        fontSize: "1rem",
        lineHeight: 1.5,
    },
    body2: {
        fontWeight: 400,
        fontSize: "0.875rem",
        lineHeight: 1.5,
    },
    button: {
        fontWeight: 500,
        fontSize: "0.875rem",
        lineHeight: 1.5,
        textTransform: "none" as const,
    },
    caption: {
        fontWeight: 400,
        fontSize: "0.75rem",
        lineHeight: 1.5,
    },
    overline: {
        fontWeight: 400,
        fontSize: "0.75rem",
        lineHeight: 1.5,
        textTransform: "uppercase" as const,
    },
};

// Define shape
const shape = {
    borderRadius: 8,
};

// Define shadows - MUI requires exactly 25 shadows
const shadows: [
    "none",
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string
] = [
        "none",
        "0px 2px 1px -1px rgba(0,0,0,0.1),0px 1px 1px 0px rgba(0,0,0,0.07),0px 1px 3px 0px rgba(0,0,0,0.06)",
        "0px 3px 1px -2px rgba(0,0,0,0.1),0px 2px 2px 0px rgba(0,0,0,0.07),0px 1px 5px 0px rgba(0,0,0,0.06)",
        "0px 3px 3px -2px rgba(0,0,0,0.1),0px 3px 4px 0px rgba(0,0,0,0.07),0px 1px 8px 0px rgba(0,0,0,0.06)",
        "0px 2px 4px -1px rgba(0,0,0,0.1),0px 4px 5px 0px rgba(0,0,0,0.07),0px 1px 10px 0px rgba(0,0,0,0.06)",
        "0px 3px 5px -1px rgba(0,0,0,0.1),0px 5px 8px 0px rgba(0,0,0,0.07),0px 1px 14px 0px rgba(0,0,0,0.06)",
        "0px 3px 5px -1px rgba(0,0,0,0.1),0px 6px 10px 0px rgba(0,0,0,0.07),0px 1px 18px 0px rgba(0,0,0,0.06)",
        "0px 4px 5px -2px rgba(0,0,0,0.1),0px 7px 10px 1px rgba(0,0,0,0.07),0px 2px 16px 1px rgba(0,0,0,0.06)",
        "0px 5px 5px -3px rgba(0,0,0,0.1),0px 8px 10px 1px rgba(0,0,0,0.07),0px 3px 14px 2px rgba(0,0,0,0.06)",
        "0px 5px 6px -3px rgba(0,0,0,0.1),0px 9px 12px 1px rgba(0,0,0,0.07),0px 3px 16px 2px rgba(0,0,0,0.06)",
        "0px 6px 6px -3px rgba(0,0,0,0.1),0px 10px 14px 1px rgba(0,0,0,0.07),0px 4px 18px 3px rgba(0,0,0,0.06)",
        "0px 6px 7px -4px rgba(0,0,0,0.1),0px 11px 15px 1px rgba(0,0,0,0.07),0px 4px 20px 3px rgba(0,0,0,0.06)",
        "0px 7px 8px -4px rgba(0,0,0,0.1),0px 12px 17px 2px rgba(0,0,0,0.07),0px 5px 22px 4px rgba(0,0,0,0.06)",
        "0px 7px 8px -4px rgba(0,0,0,0.1),0px 13px 19px 2px rgba(0,0,0,0.07),0px 5px 24px 4px rgba(0,0,0,0.06)",
        "0px 7px 9px -4px rgba(0,0,0,0.1),0px 14px 21px 2px rgba(0,0,0,0.07),0px 5px 26px 4px rgba(0,0,0,0.06)",
        "0px 8px 9px -5px rgba(0,0,0,0.1),0px 15px 22px 2px rgba(0,0,0,0.07),0px 6px 28px 5px rgba(0,0,0,0.06)",
        "0px 8px 10px -5px rgba(0,0,0,0.1),0px 16px 24px 2px rgba(0,0,0,0.07),0px 6px 30px 5px rgba(0,0,0,0.06)",
        "0px 8px 11px -5px rgba(0,0,0,0.1),0px 17px 26px 2px rgba(0,0,0,0.07),0px 6px 32px 5px rgba(0,0,0,0.06)",
        "0px 9px 11px -5px rgba(0,0,0,0.1),0px 18px 28px 2px rgba(0,0,0,0.07),0px 7px 34px 6px rgba(0,0,0,0.06)",
        "0px 9px 12px -6px rgba(0,0,0,0.1),0px 19px 29px 2px rgba(0,0,0,0.07),0px 7px 36px 6px rgba(0,0,0,0.06)",
        "0px 10px 13px -6px rgba(0,0,0,0.1),0px 20px 31px 3px rgba(0,0,0,0.07),0px 8px 38px 7px rgba(0,0,0,0.06)",
        "0px 10px 13px -6px rgba(0,0,0,0.1),0px 21px 33px 3px rgba(0,0,0,0.07),0px 8px 40px 7px rgba(0,0,0,0.06)",
        "0px 10px 14px -6px rgba(0,0,0,0.1),0px 22px 35px 3px rgba(0,0,0,0.07),0px 8px 42px 7px rgba(0,0,0,0.06)",
        "0px 11px 14px -7px rgba(0,0,0,0.1),0px 23px 36px 3px rgba(0,0,0,0.07),0px 9px 44px 8px rgba(0,0,0,0.06)",
        "0px 11px 15px -7px rgba(0,0,0,0.1),0px 24px 38px 3px rgba(0,0,0,0.07),0px 9px 46px 8px rgba(0,0,0,0.06)",
    ];

// Define components overrides
const components = {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                padding: "8px 16px",
                textTransform: "none" as const,
            },
            contained: {
                boxShadow: "none",
                "&:hover": {
                    boxShadow: "none",
                },
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 12,
                boxShadow:
                    "0px 2px 4px -1px rgba(0,0,0,0.06),0px 4px 5px 0px rgba(0,0,0,0.05),0px 1px 10px 0px rgba(0,0,0,0.04)",
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            rounded: {
                borderRadius: 12,
            },
        },
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                "& .MuiOutlinedInput-root": {
                    borderRadius: 8,
                },
            },
        },
    },
    MuiLinearProgress: {
        styleOverrides: {
            root: {
                borderRadius: 4,
                height: 8,
            },
        },
    },
    MuiMenuItem: {
        styleOverrides: {
            root: {
                minHeight: 40,
            },
        },
    },
    MuiListItem: {
        styleOverrides: {
            root: {
                borderRadius: 8,
            },
        },
    },
    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: 16,
            },
        },
    },
};

// Create base theme
const baseTheme = {
    palette,
    typography,
    shape,
    shadows,
    components,
};

// Create LTR theme
const ltrTheme = responsiveFontSizes(
    createTheme(
        deepmerge(baseTheme, {
            direction: "ltr",
        })
    )
);

// Create RTL theme
const rtlTheme = responsiveFontSizes(
    createTheme(
        deepmerge(baseTheme, {
            direction: "rtl",
        })
    )
);

export { ltrTheme, rtlTheme };
