import CrystalMist from "../../shared/CrystalMist"
import style from "../../assets/css/CrystalMist.module.css"
import "../../assets/css/FormStyles.css"
import { useForm } from "react-hook-form"
import { useRef } from "react"

type FormData ={
    username : string,
    password: string
}

export default function LogIn() {
    const usernameRef = useRef(null)
    const { 
        register, 
        handleSubmit, 
        formState: { errors }
    } = useForm({
        shouldUseNativeValidation: true,
    })

    const onSubmit = (data : FormData) => {
        console.log(data)
    }

    return (
        <CrystalMist header={<h1>Log In</h1>}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex gap-6 p-4 flex-col justify-center">
                    
                    <div className="flex flex-col gap-2">
                        <label htmlFor="username">Username</label>
                        <input 
                            {...register("username", { required: "Username is required" })}
                            type="text" 
                            className={style.glassButton} 
                            placeholder="Username" 
                            id="username"
                        />
                        {errors.username && <p ref={usernameRef} className={`${"error"}`}>{errors.username.message}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password">Password</label>
                        <input 
                            {...register("password", { required: true, minLength: 6 })}
                            type="password" 
                            className={style.glassButton} 
                            placeholder="Password" 
                            id="password"
                        />
                    </div>

                    <div className="w-fit">
                        <button 
                            type="submit" 
                            className={style.glassButton}
                            // TODO:
                            // onClick={()=>console.log(usernameRef.current?.classList.remove("error"))}
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </form>
        </CrystalMist>
    )
}
