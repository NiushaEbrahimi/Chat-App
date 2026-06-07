// TODO:
import "../assets/css/Shared.css"
import background from "../assets/images/AuthBackground.jpeg"
export default function Loading(){
    return(
        <main className="w-screen min-h-screen">
        <img src={background} alt="background" className="w-full h-full object-cover absolute -z-10 blur-xs"/>
        <section className="w-full h-screen flex justify-center items-center gap-2">
          <div className="bg-white w-7 h-7 rounded-4xl firstDot"></div>
          <div className="bg-white w-7 h-7 rounded-4xl secondDot"></div>
          <div className="bg-white w-7 h-7 rounded-4xl thirdDot"></div>
        </section>
    </main>
    )
}