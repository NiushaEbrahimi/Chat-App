import {createBrowserRouter , Navigate, RouterProvider} from "react-router-dom"
import { Suspense, lazy } from "react";

import RouteError from "./shared/RouteError";
import ChatLayout from "./shared/ChatLayout";
import AuthLayout from "./shared/AuthLayout";
import NotFound from "./shared/NotFound"
import ProtectedRoute from "./features/auth/ProtectedRoute";
import LogIn from "./features/auth/LogIn";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";

const ChatConversionList = lazy(()=>import("./features/chat/ChatConversionList"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <ChatLayout />,
    errorElement: <RouteError/>,
    children: [
      {
        index: true,
        path: "/chat",
        element: (
          <ProtectedRoute>
            <ChatConversionList />
          </ProtectedRoute>          
        ),
      },
      {
        path : "*",
        element : <NotFound/>
      }
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    errorElement: <RouteError/>,
    children: [
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
      {
        path: "login",
        element: <LogIn />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "forget-password",
        element: <ForgotPasswordPage/>
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage/>
      },
      {
        path : "*",
        element : <NotFound/>
      }
    ],
  },
]);

export default function App(){
  return(
    <Suspense fallback={"loading"}>
      <RouterProvider router={router}/>
    </Suspense>
  )
}