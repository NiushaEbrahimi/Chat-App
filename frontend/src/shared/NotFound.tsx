// TODO: 
import CrystalMist from "./CrystalMist"
import background from "../assets/images/AuthBackground.jpeg"
import programmer from "../assets/images/Programmer.PNG"
import style from "../assets/css/CrystalMist.module.css"

import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { ArrowBigLeft } from "lucide-react"

export default function NotFound(){
    const navigate = useNavigate()
    return(
        <>
            <img src={background} alt="background" className="w-full h-full object-cover absolute -z-10"/>
            <div className="h-screen flex justify-center items-center">
            <CrystalMist header = {<h1>Not Found !</h1>}>
                <div className="grid grid-cols-2">
                    <div className="px-4 h-full flex flex-col justify-center items-start gap-2">
                        <div className="mb-5 w-4/5">
                            <h2 className="text-2xl mb-3">Page Doesn't Exist</h2>
                            <p>Try searching for other pages this page is not available</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <button className={`w-fit ${style.glassButton}`} onClick={() => navigate(-1)}>Go Back</button>
                            <Link to={"/chat"} className="flex underline linkBack"><ArrowBigLeft className="backArrow"/>Go Home</Link>
                        </div>
                    </div>
                    <div>
                        <img src={programmer} alt="programmer" className="w-fit h-fit" />
                    </div>
                </div>
            </CrystalMist>
            </div>
        </>
    )
}