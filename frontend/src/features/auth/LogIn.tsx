import CrystalMist from "../../shared/CrystalMist"
import Spinner from "../../shared/Spinner.tsx"

import style from "../../assets/css/CrystalMist.module.css"
import "../../assets/css/FormStyles.css"

import { useForm, } from "react-hook-form"
import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux";

import { loginUser } from "../../api/auth"
import type { LoginPayload } from "../../types/authTypes"
import { setRateLimit } from "../../store/slices/authSlice.ts"
import type { RootState } from "../../store/index.ts"
import CountDown from "./components/CountDown.tsx"

export default function LogIn() {
    const [loading, setLoading] = useState(false);
    const emailRef = useRef(null)
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {     
        register, 
        handleSubmit, 
        setError,
        formState: { errors }
    } = useForm<LoginPayload>({
        shouldUseNativeValidation: true,
    })

    const rateLimitUntil = useSelector((state: RootState) => state.auth.rateLimitUntil);

    const onSubmit = (data : LoginPayload) => {
        setLoading(true);
        loginUser(data)
            .then(() => {
                console.log("Login successful");
                navigate("/chat");
            })
            .catch((error) => {
                if (error.response && error.response.status === 401) {
                    setError("root", {
                        type: "manual",
                        message: "Invalid email or password",
                    });
                }else if (error.response && error.response.status === 429) {
                    dispatch(setRateLimit());
                    setError("root", {
                        type: "manual",
                        message: "Too many requests. Please try again later.",
                    });
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }

    return (
        <CrystalMist header={<h1>Log In</h1>}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-6 p-4 flex-col justify-center">
                    {/* TODO: change this to a username/email input */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email">Email</label>
                        {/* TODO: put css for this to translate from the input to the top of the input */}
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
                    {errors.root && (
                        <p className={`${"error"} text-center`}>{errors.root.message}</p>
                    )}
                    <div className="w-full flex justify-center">
                        <button 
                            disabled={!!rateLimitUntil}
                            type="submit" 
                            className={style.glassButton}
                        >
                            {/* TODO: need to implement this to localstorage or redux-persist */}
                            {loading 
                            ? <Spinner/>
                            : rateLimitUntil
                            ? <CountDown/>
                            : <p>Log in</p>
                            }
                        </button>
                    </div>
                </div>
            </form>
        </CrystalMist>
    )
}
