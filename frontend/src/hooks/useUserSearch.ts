import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { useEffect, useState } from 'react';

function useDebounce(value: string, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export const useUserSearch = (query: string) => {
  const debounced = useDebounce(query)
  return useQuery({
    queryKey: ['users', debounced],
    queryFn: () => apiClient.get(`/api/auth/users/?search=${debounced}`).then(r => r.data),
    enabled: debounced.length > 0,
  })
}