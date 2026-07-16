import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Provider } from "react-redux";
import App from './App.tsx'
import { store } from './store/index.ts';
import { setStoreRef } from './store/slices/authSlice';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Set up store reference for auth slice to listen to localStorage changes
setStoreRef(store);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </StrictMode>
)
