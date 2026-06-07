import {createBrowserRouter , Navigate, RouterProvider} from "react-router-dom"
import { Suspense, lazy } from "react";

import ChatLayout from "./shared/ChatLayout";
import AuthLayout from "./shared/AuthLayout";
import Loading from "./shared/Loading"

const ChatConversionList = lazy(() => import("./features/chat/ChatConversionList"));
const RouteError = lazy(() => import("./shared/RouteError"));
const NotFound = lazy(() => import("./shared/NotFound"));
const ProtectedRoute = lazy(() => import("./features/auth/ProtectedRoute"));
const LogIn = lazy(() => import("./features/auth/LogIn"));
const RegisterPage = lazy(() => import("./features/auth/RegisterPage"))
const ForgotPasswordPage = lazy(() => import("./features/auth/ForgotPasswordPage"))
const ResetPasswordPage = lazy(() => import("./features/auth/ResetPasswordPage"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <ChatLayout />,
    errorElement: <RouteError/>,
    children: [
      {
        index: true,
        element: <Navigate to="chat" replace />,
      },
      {
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
    <Suspense fallback={<Loading/>}>
      <RouterProvider router={router}/>
    </Suspense>
  )
}