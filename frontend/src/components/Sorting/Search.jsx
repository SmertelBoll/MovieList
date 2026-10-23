import { IconButton } from "@mui/material";
import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

import TextFieldCustom from "../_customMUI/TextFieldCustom";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

function Search({ inputText, onChangeInput, label = "Search" }) {
    const theme = useTheme();
    const SearchBox = useMemo(() => TextFieldCustom(
        theme.palette.bg.main,
        theme.palette.text.main
    ), [theme.palette.mode]);

    const handleChange = (e) => {
        onChangeInput(e);
    };
    const handleClear = (e) => {
        onChangeInput(e, true);
    };
    return (
        <SearchBox
            // autoFocus
            label={label}
            value={inputText}
            onChange={handleChange}
            size="small"
            sx={{
                width: "100%",
                "& .Mui-focused .MuiIconButton-root": { color: "text.main" },
                "& .MuiOutlinedInput-notchedOutline": { borderRadius: "30px" },
                "& .MuiInputBase-input": {
                    "&:-webkit-autofill": {
                        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.bg.second} inset`,
                        WebkitTextFillColor: theme.palette.text.main,
                    },
                    "&:-webkit-autofill:hover": {
                        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.bg.second} inset`,
                    },
                    "&:-webkit-autofill:focus": {
                        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.bg.second} inset`,
                    },
                },
            }}
            slotProps={{
                input: {
                    startAdornment: (
                        // disabled only so the magnifier isn't clickable; MUI greys it, so restore the outline color.
                        // size="small": a regular button (48px) would push the field above 40px.
                        <IconButton disabled size="small" sx={{ "&.Mui-disabled": { color: "text.main" } }}>
                            <SearchIcon fontSize="small" />
                        </IconButton>
                    ),
                    endAdornment: (
                        <IconButton
                            size="small"
                            sx={{ visibility: inputText ? "visible" : "hidden" }}
                            onClick={handleClear}
                        >
                            <ClearIcon fontSize="small" />
                        </IconButton>
                    ),
                },
            }}
        />

    );
}

export default Search;