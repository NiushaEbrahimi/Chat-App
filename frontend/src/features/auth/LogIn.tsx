import CrystalMist from "../../shared/CrystalMist"
import Spinner from "../../shared/Spinner.tsx"

import style from "../../assets/css/CrystalMist.module.css"
import "../../assets/css/FormStyles.css"

import { useForm } from "react-hook-form"
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { loginUser } from "../../api/auth"
import type { LoginPayload } from "../../types/authTypes"

export default function LogIn() {
    const [loading, setLoading] = useState(false);
    const emailRef = useRef(null)
    const navigate = useNavigate();
    const {     
        register, 
        handleSubmit, 
        formState: { errors }
    } = useForm<LoginPayload>({
        shouldUseNativeValidation: true,
    })

    const onSubmit = (data : LoginPayload) => {
        setLoading(true);
        loginUser(data)
            .then(() => {
                console.log("Login successful");
                navigate("/chat");
            })
            .catch((error) => {
                console.error("Login failed:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <CrystalMist header={<h1>Log In</h1>}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-6 p-4 flex-col justify-center">
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email">Email</label>
                        <input 
                            {...register("email", { required: "Email is required" })}
                            type="text" 
                            className={style.glassButton} 
                            placeholder="Email" 
                            id="email"
                        />
                        {errors.email && <p ref={emailRef} className={`${"error"}`}>{errors.email.message}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password">Password</label>
                        <input 
                            {...register("password", { required: "Password is required", minLength: 6 })}
                            type="password" 
                            className={style.glassButton} 
                            placeholder="Password" 
                            id="password"
                        />
                    </div>

                    <div className="w-full flex justify-center">
                        <button 
                            type="submit" 
                            className={style.glassButton}
                            // TODO:
                            // onClick={()=>console.log(usernameRef.current?.classList.remove("error"))}
                        >
                            {loading 
                            ? <Spinner/>
                            : <p>Log in</p>
                            }
                        </button>
                    </div>
                </div>
            </form>
        </CrystalMist>
    )
}
