import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../axios";

// Індекс збережених елементів: де лежить кожен фільм/серіал.
// byKey: { "movie:<tmdbId>": [{ mongoId, folderName, status, image }], "tv:<tmdbId>": [...] }
// Кожна копія лежить в одній папці, тож кілька копій = кілька папок.
// Повні дані копії (оцінка, коментар...) тут не тримаємо — їх тягнемо за mongoId, коли треба.

export const savedKey = (mediaType, tmdbId) => `${mediaType}:${tmdbId}`;

export const fetchSaved = createAsyncThunk("saved/fetchSaved", async () => {
  const res = await axios.get("/items/saved");
  return res.data.results;
});

const initialState = {
  byKey: {},
  isLoaded: false,
};

const savedSlice = createSlice({
  name: "saved",
  initialState,
  reducers: {
    clearSaved: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSaved.fulfilled, (state, action) => {
      state.byKey = action.payload;
      state.isLoaded = true;
    });
    // Помилку не показуємо: індекс допоміжний, без нього кнопки просто працюють як для незбереженого
  },
});

// Один і той самий порожній масив — щоб useSelector не перерендерював компоненти без причини
const EMPTY = [];
export const selectSavedCopies = (mediaType, tmdbId) => (state) =>
  state.saved.byKey[savedKey(mediaType, tmdbId)] || EMPTY;

export const { clearSaved } = savedSlice.actions;
export const savedReducer = savedSlice.reducer;
