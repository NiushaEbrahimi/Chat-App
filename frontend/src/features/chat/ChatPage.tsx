import { fetchRooms } from "../../api/chat";
import { useQuery } from "@tanstack/react-query";
// add useQuery first, nothing else
const ChatPage = () => {
  const { data, error, isError } = useQuery({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
    retry: false,   // don't retry so we see the error immediately
  });

  if (isError) {
    console.log('ROOMS ERROR:', error);
    return <div>Error: {String(error)}</div>;  // show error instead of redirecting
  }

  return <div>Chat page - rooms: {JSON.stringify(data?.data)}</div>;
};
export default (ChatPage)