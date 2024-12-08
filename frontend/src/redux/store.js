import { configureStore } from "@reduxjs/toolkit";
import { postsReducer } from "./slices/PostsSlice";
import { authReducer } from "./slices/AuthSlice";

const store = configureStore({
  reducer: {
    posts: postsReducer,
    auth: authReducer,
  },
});

export default store;
