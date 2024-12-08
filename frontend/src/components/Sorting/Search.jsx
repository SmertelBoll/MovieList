import { IconButton } from "@mui/material";
import React, { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

import TextFieldCustom from "../customMUI/TextFieldCustom";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

function Search({ inputText, onChangeInput }) {
    const theme = useTheme();
    const SearchBox = useMemo(() => TextFieldCustom("bg.main", theme.palette.text.main), [theme.palette.mode]);

    const handleChange = (e) => {
        onChangeInput(e);
    };
    const handleClear = (e) => {
        onChangeInput(e, true);
    };
    return (
        <SearchBox
            autoFocus
            label="Search"
            value={inputText}
            onChange={handleChange}
            sx={{
                width: "100%",
                "& .Mui-focused .MuiIconButton-root": { color: "text.main" },
                "& .MuiOutlinedInput-notchedOutline": { borderRadius: "30px" },
            }}
            slotProps={{
                input: {
                    startAdornment: (
                        <IconButton disabled>
                            <SearchIcon />
                        </IconButton>
                    ),
                    endAdornment: (
                        <IconButton
                            sx={{ visibility: inputText ? "visible" : "hidden" }}
                            onClick={handleClear}
                        >
                            <ClearIcon />
                        </IconButton>
                    ),
                },
            }}
        />

    );
}

export default Search;