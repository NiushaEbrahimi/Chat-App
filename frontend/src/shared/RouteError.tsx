import { useRouteError, isRouteErrorResponse } from "react-router-dom";

export default function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <h1>404 - Page Not Found</h1>;
  }

  return <h1>Something went wrong</h1>;
}