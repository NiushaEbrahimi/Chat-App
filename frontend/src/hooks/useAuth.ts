import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { login, logout } from "../store/slices/authSlice";
import type { User } from "../types/authTypes";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  return {
    user,
    token,
    isAuthenticated,
    login: (payload: { user:User; token: string }) => dispatch(login(payload)),
    logout: () => dispatch(logout()),
  };
};