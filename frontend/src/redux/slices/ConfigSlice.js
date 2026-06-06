import { createSlice } from "@reduxjs/toolkit";
import axios from "../../axios";

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

// -- THUNKS: зберігають вибір локально і (якщо користувач залогінений) у профілі на сервері --

// Зберігає налаштування на сервері, не блокуючи UI у разі помилки
const persistSettings = async (payload, getState) => {
    if (!getState().auth.data) return; // не залогінений — лише локально
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

export const changeThemeMode = (mode) => async (dispatch, getState) => {
    dispatch(setMode(mode));
    await persistSettings({ themeMode: mode }, getState);
};

export const toggleThemeMode = () => async (dispatch, getState) => {
    const nextMode = getState().config.mode === "light" ? "dark" : "light";
    dispatch(changeThemeMode(nextMode));
};

export const configReducer = configSlice.reducer;
