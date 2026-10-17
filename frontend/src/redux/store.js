import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./slices/AuthSlice";
import { configReducer } from "./slices/ConfigSlice";
import { savedReducer } from "./slices/SavedSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    config: configReducer,
    saved: savedReducer,
  },
});

export default store;
