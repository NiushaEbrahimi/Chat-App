import { Outlet } from "react-router-dom";
import background from "../../src/assets/images/AuthBackground.jpeg"

export default function AuthLayout() {
  return (
    <main className="w-screen min-h-screen">
        <img src={background} alt="background" className="w-full h-full object-cover absolute -z-10"/>
        <section className="w-full h-screen flex justify-center items-center">
          <Outlet />
        </section>
    </main>
  );
}