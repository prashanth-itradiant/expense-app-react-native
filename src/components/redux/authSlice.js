import { VITE_API_URL } from '@env';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
console.log('VITE_API_URL:', VITE_API_URL);
// ✅ Login user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${VITE_API_URL}/users/login`,
        { email, password },
        { withCredentials: true },
      );

      return data; // expects { user, role }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed!');
    }
  },
);

// ✅ Fetch authenticated user
export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${VITE_API_URL}/users/auth/me`, {
        withCredentials: true,
      });

      if (!data) return rejectWithValue('User not found');

      return {
        user: data.data,
        role: data.data?.role || null,
      };
    } catch (error) {
      return rejectWithValue('User fetch failed');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    data: null,
    role: null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: state => {
      state.data = null;
      state.role = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload?.user || null;
        state.role = action.payload?.role || null;
      })
      .addCase(fetchUser.rejected, state => {
        state.loading = false;
        state.data = null;
        state.role = null;
        state.error = 'User fetch failed';
      })
      .addCase(loginUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.user;
        state.role = action.payload.role;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
