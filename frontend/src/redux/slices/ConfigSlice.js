import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios";
import { DEFAULT_DATE_FORMAT, isDateFormat } from "../../utils/dateFormats";

// Special filter value: "no tags" (items with an empty customType)
export const NO_TAG = "__none__";

const savedMode = window.localStorage.getItem("MovieList-mode");
const savedLanguage = window.localStorage.getItem("MovieList-language");
const savedTypeTMDB = window.localStorage.getItem("MovieList-typeTMDB");
const savedCustomTypes = window.localStorage.getItem("MovieList-customTypes");
const savedDateFormat = window.localStorage.getItem("MovieList-dateFormat");
const savedViewMode = window.localStorage.getItem("MovieList-viewMode");

const initialState = {
    mode: savedMode ? savedMode : "light",
    language: savedLanguage ? savedLanguage : "en",
    typeTMDB: savedTypeTMDB ? JSON.parse(savedTypeTMDB) : ["movie", "tv"],
    customTypes: savedCustomTypes ? JSON.parse(savedCustomTypes) : [],
    viewMode: savedViewMode === "list" ? "list" : "cards",
    dateFormat: isDateFormat(savedDateFormat) ? savedDateFormat : DEFAULT_DATE_FORMAT,
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
        setViewMode: (state, action) => {
            state.viewMode = action.payload === "list" ? "list" : "cards";
            window.localStorage.setItem("MovieList-viewMode", state.viewMode);
        },
        setDateFormat: (state, action) => {
            state.dateFormat = action.payload;
            window.localStorage.setItem("MovieList-dateFormat", action.payload);
        },
        setCustomTypes: (state, action) => {
            state.customTypes = action.payload;
            window.localStorage.setItem("MovieList-customTypes", JSON.stringify(action.payload));
        },
    },
});

export const { setMode, setLanguage, setTypeTMDB, setCustomTypes, toggleMode, setDateFormat, setViewMode } = configSlice.actions;

// Saves settings to the server without blocking the UI on failure
const persistSettings = async (payload, getState) => {
    if (!getState().auth.data) return;
    try {
        await axios.patch("/auth/settings", payload);
    } catch (err) {
        console.warn("Failed to save settings:", err);
    }
};

export const changeLanguage = (code) => async (dispatch, getState) => {
    dispatch(setLanguage(code));
    await persistSettings({ language: code }, getState);
};

export const changeDateFormat = (format) => async (dispatch, getState) => {
    dispatch(setDateFormat(format));
    await persistSettings({ dateFormat: format }, getState);
};

export const changeThemeMode = (mode) => async (dispatch, getState) => {
    dispatch(setMode(mode));
    await persistSettings({ themeMode: mode }, getState);
};

export const toggleThemeMode = () => async (dispatch, getState) => {
    const nextMode = getState().config.mode === "light" ? "dark" : "light";
    dispatch(changeThemeMode(nextMode));
};

export const configReducer = configSlice.reducer;
