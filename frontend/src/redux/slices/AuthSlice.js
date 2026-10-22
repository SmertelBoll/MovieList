import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "../../axios";

export const fetchAuth = createAsyncThunk("auth/fetchAuth", async (params) => {
  const res = await axios.post("/auth/login", params);
  return res.data;
});

export const fetchAuthMe = createAsyncThunk("auth/fetchAuthMe", async () => {
  const res = await axios.get("/auth/me");
  return res.data;
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

const initialState = {
  data: null,
  isLoaded: false,
  isChecking: hasToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.data = null;
      state.isLoaded = false;
    },
    setUserTypeCustom: (state, action) => {
      if (state.data) {
        state.data.typeCustom = action.payload;
      }
    },
    updateUserData: (state, action) => {
      if (state.data) {
        state.data = { ...state.data, ...action.payload };
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
      })
      .addCase(fetchAuth.rejected, (state) => {
        state.data = null;
        state.isLoaded = false;
      })
      .addCase(fetchAuthMe.pending, (state) => {
        state.data = null;
        state.isLoaded = false;
      })
      .addCase(fetchAuthMe.fulfilled, (state, action) => {
        state.data = action.payload;
        state.isLoaded = true;
        state.isChecking = false;
      })
      .addCase(fetchAuthMe.rejected, (state) => {
        state.data = null;
        state.isLoaded = false;
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
