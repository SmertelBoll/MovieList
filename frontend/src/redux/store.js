import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./slices/AuthSlice";
import { configReducer } from "./slices/ConfigSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    config: configReducer,
  },
});

export default store;
