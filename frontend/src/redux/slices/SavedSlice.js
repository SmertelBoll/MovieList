import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../axios";

// Saved-items index: where each movie/tv lives (one copy per folder, so several copies = several folders). Full copy
// data is fetched by mongoId when needed.
// byKey: { "movie:<tmdbId>": [{ mongoId, folderName, status, image }], "tv:<tmdbId>": [...] }

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
    // No error shown: the index is auxiliary, without it the buttons just behave as for an unsaved item.
  },
});

// One shared empty array so useSelector doesn't re-render components for no reason.
const EMPTY = [];
export const selectSavedCopies = (mediaType, tmdbId) => (state) =>
  state.saved.byKey[savedKey(mediaType, tmdbId)] || EMPTY;

export const { clearSaved } = savedSlice.actions;
export const savedReducer = savedSlice.reducer;
