import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from '../../services/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users/login', { email, password });
      await saveAuthToken(data.token);
      return { user: data.data, role: data.data?.role };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      if (!(await getAuthToken())) return rejectWithValue('No saved session');
      const { data } = await api.get('/users/auth/me');
      return { user: data.data, role: data.role || data.data?.role || null };
    } catch (error) {
      if (error.response?.status === 401) await clearAuthToken();
      return rejectWithValue(
        error.response?.data?.message || 'User fetch failed',
      );
    }
  },
);

export const completeMicrosoftLogin = createAsyncThunk(
  'auth/completeMicrosoftLogin',
  async (code, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/azure/mobile/exchange', { code });
      await saveAuthToken(data.token);
      return await dispatch(fetchUser()).unwrap();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Microsoft login failed',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { data: null, role: null, loading: false, error: null },
  reducers: {
    logout: state => {
      clearAuthToken();
      state.data = null;
      state.role = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addMatcher(
        action =>
          action.type.startsWith('auth/') && action.type.endsWith('/pending'),
        state => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        action =>
          action.type.startsWith('auth/') && action.type.endsWith('/fulfilled'),
        (state, action) => {
          state.loading = false;
          if (action.payload?.user) {
            state.data = action.payload.user;
            state.role = action.payload.role;
          }
        },
      )
      .addMatcher(
        action =>
          action.type.startsWith('auth/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'Authentication failed';
          if (action.type.includes('fetchUser')) {
            state.data = null;
            state.role = null;
          }
        },
      );
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
