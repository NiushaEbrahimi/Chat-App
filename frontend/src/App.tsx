import {createBrowserRouter , RouterProvider} from "react-router-dom"
import { Suspense, lazy } from "react";

import RouteError from "./shared/RouteError";
import ChatLayout from "./shared/ChatLayout";
import AuthLayout from "./shared/AuthLayout";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import LogIn from "./features/auth/LogIn";

const ChatConversionList = lazy(()=>import("./features/chat/ChatConversionList"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <ChatLayout />,
    errorElement: <RouteError/>,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <ChatConversionList />
          </ProtectedRoute>          
        ),
      },
      {
        path: "login",
        element: <LogIn />,
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    errorElement: <RouteError/>,
    children: [
      {
        path: "login",
        element: <LogIn />,
      },
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