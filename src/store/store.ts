import { configureStore } from '@reduxjs/toolkit';
import ticketReducer from '../features/tickets/ticketSlice';

export const store = configureStore({
  reducer: {
    tickets: ticketReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
