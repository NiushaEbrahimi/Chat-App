import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import NotFound from "./NotFound";
export default function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound/>;
  }
//  TODO: handle this
  return <h1>Something went wrong</h1>;
}