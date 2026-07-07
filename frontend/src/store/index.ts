import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import chatSlice from "./slices/chatSlice"
import newConvoSlice from "./slices/newConvo"
import uiSlice from "./slices/uiSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    newConvo: newConvoSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;