import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../axios";

export const fetchAuth = createAsyncThunk("auth/fetchAuth", async (params) => {
  const res = await axios.post("/auth/login", params);
  return res.data;
});

export const fetchAuthMe = createAsyncThunk("auth/fetchAuthMe", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get("/auth/me");
    return res.data;
  } catch (error) {
    // status null = no answer from the server (offline, or Render still waking up): the session isn't over
    return rejectWithValue({ status: error.response?.status ?? null });
  }
});

export const fetchRegister = createAsyncThunk("auth/fetchRegister", async (params) => {
  try {
    const res = await axios.post("/auth/register", params);
    return { data: res.data };
  } catch (error) {
    return { error };
  }
});

// A token exists, so wait for /auth/me before deciding "logged in or not": until then data is empty and pages
// would flash "log in". Without a token there's nothing to wait for.
const hasToken = () => {
  try {
    return Boolean(window.localStorage.getItem(process.env.REACT_APP_TOKEN_KEY));
  } catch {
    return false;
  }
};

// The last profile the server sent. With it the app opens as logged in even when the server is asleep or unreachable;
// /auth/me then replaces it. The token and the password hash never go into it.
const USER_KEY = "MovieList-user";

const saveUser = (user) => {
  try {
    if (!user) return;
    const { token, passwordHash, ...profile } = user;
    window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or blocked: the profile just isn't remembered
  }
};

const clearUser = () => {
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing to clear
  }
};

const loadUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

const cachedUser = hasToken() ? loadUser() : null;

const initialState = {
  data: cachedUser,
  isLoaded: Boolean(cachedUser),
  // Nothing to wait for when the cached profile is there: the page opens at once
  isChecking: hasToken() && !cachedUser,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.data = null;
      state.isLoaded = false;
      clearUser();
    },
    setUserTypeCustom: (state, action) => {
      if (state.data) {
        state.data.typeCustom = action.payload;
        saveUser(state.data);
      }
    },
    updateUserData: (state, action) => {
      if (state.data) {
        state.data = { ...state.data, ...action.payload };
        saveUser(state.data);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuth.pending, (state) => {
        state.data = null;
        state.isLoaded = false;
      })
      .addCase(fetchAuth.fulfilled, (state, action) => {
        state.data = action.payload;
        state.isLoaded = true;
        saveUser(action.payload);
      })
      .addCase(fetchAuth.rejected, (state) => {
        state.data = null;
        state.isLoaded = false;
      })
      // The cached profile stays on screen while /auth/me is in flight
      .addCase(fetchAuthMe.fulfilled, (state, action) => {
        state.data = action.payload;
        state.isLoaded = true;
        state.isChecking = false;
        saveUser(action.payload);
      })
      .addCase(fetchAuthMe.rejected, (state, action) => {
        // Only the server saying "who are you?" ends the session; no answer keeps the cached profile
        const status = action.payload?.status;
        const sessionEnded = status === 401 || status === 403 || status === 404;
        if (sessionEnded || !state.data) {
          state.data = null;
          state.isLoaded = false;
        }
        if (sessionEnded) clearUser();
        state.isChecking = false;
      })
      .addCase(fetchRegister.pending, (state) => {
        state.data = null;
        state.isLoaded = false;
      })
      .addCase(fetchRegister.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.data = action.payload.data;
          state.isLoaded = true;
          saveUser(action.payload.data);
        } else {
          state.data = null;
          state.isLoaded = false;
        }
      })
      .addCase(fetchRegister.rejected, (state) => {
        state.data = null;
        state.isLoaded = false;
      });
  },
});

export const selectIsAuth = (state) => Boolean(state.auth.data);

export const authReducer = authSlice.reducer;

export const { logout, setUserTypeCustom, updateUserData } = authSlice.actions;
