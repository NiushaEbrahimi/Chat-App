import { Outlet } from "react-router-dom";
import background from "../assets/images/lightBackground.webp"
export default function ChatLayout() {
  return (
    <main className="w-screen min-h-screen">
      <img src={background} alt="background" className="w-full h-full object-cover absolute -z-10"/>
      <Outlet />
    </main>
  );
}