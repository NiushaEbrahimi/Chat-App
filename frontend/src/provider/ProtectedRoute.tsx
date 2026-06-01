import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";


export default function ProtectedRoute({ children }: { children: ReactNode }) {
    // get this from the auth hook
    const isAuthenticated = true;
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
