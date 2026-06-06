import { createSlice } from "@reduxjs/toolkit";

const savedMode = window.localStorage.getItem("MovieList-mode");
const savedLanguage = window.localStorage.getItem("MovieList-language");
const savedTypeTMDB = window.localStorage.getItem("MovieList-typeTMDB");
const savedCustomType = window.localStorage.getItem("MovieList-customType");

const initialState = {
    mode: savedMode ? savedMode : "light",
    language: savedLanguage ? savedLanguage : "en",
    typeTMDB: savedTypeTMDB ? JSON.parse(savedTypeTMDB) : ["movie", "tv"],
    customType: savedCustomType ? savedCustomType : "",
};

const configSlice = createSlice({
    name: "config",
    initialState,
    reducers: {
        setMode: (state, action) => {
            state.mode = action.payload;
            window.localStorage.setItem("MovieList-mode", action.payload);
        },
        toggleMode: (state) => {
            state.mode = state.mode === "light" ? "dark" : "light";
            window.localStorage.setItem("MovieList-mode", state.mode);
        },
        setLanguage: (state, action) => {
            state.language = action.payload;
            window.localStorage.setItem("MovieList-language", action.payload);
        },
        setTypeTMDB: (state, action) => {
            state.typeTMDB = action.payload;
            window.localStorage.setItem("MovieList-typeTMDB", JSON.stringify(action.payload));
        },
        setCustomType: (state, action) => {
            state.customType = action.payload;
            window.localStorage.setItem("MovieList-customType", action.payload);
        },
    },
});

export const { setMode, setLanguage, setTypeTMDB, setCustomType, toggleMode } = configSlice.actions;

export const configReducer = configSlice.reducer;
