import { Outlet } from "react-router-dom";

export default function ChatLayout() {
  return (
    <main className="w-screen min-h-screen">
      <Outlet />
    </main>
  );
}