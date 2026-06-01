import {createBrowserRouter , RouterProvider} from "react-router-dom"
import { Suspense, lazy } from "react";

import RouteError from "./shared/RouteError";
import Layout from "./shared/Layout";
import ProtectedRoute from "./provider/ProtectedRoute";

const ChatConversionList = lazy(()=>import("./features/chat/ChatConversionList"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
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
    ],
  },
]);

export default function App(){
  <Suspense fallback={"loading"}>
    <RouterProvider router={router}/>
  </Suspense>
}