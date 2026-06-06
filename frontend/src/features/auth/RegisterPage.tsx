import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../api/auth";
import axios from "axios";
import type { SignUpPayload } from "../../types/authTypes";

import CrystalMist from "../../shared/CrystalMist";
import style from "../../assets/css/CrystalMist.module.css"
import {TriangleAlert} from "lucide-react"

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpPayload>();

  const onSubmit = async (data : SignUpPayload) => {
    setServerError(null);
    try {
      await registerUser(data);
      navigate("/login", { state: { message: "Account created! Please log in." } });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data;
        if (detail?.email) setServerError(detail.email[0]);
        else if (detail?.username) setServerError(detail.username[0]);
        else setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <CrystalMist header={<h1>Sign Up</h1>}>
        <div>

            {serverError && (
                <div style={{ background: "var(--secondary)"}} className="flex text-black p-3 gap-2 rounded-xl">
                {serverError} <TriangleAlert color="red"/>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }} className="p-4">
                <div className="flex flex-col">
                    <label>Email</label>
                    <input type="email" {...register("email")} className={style.glassButton} placeholder="Email"/>
                    {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
                </div>

                <div className="flex flex-col">
                    <label>Username</label>
                    <input type="text" {...register("username")} className={style.glassButton} placeholder="Username"/>
                    {errors.username && <span style={errorStyle}>{errors.username.message}</span>}
                </div>

                <div className="flex flex-col">
                    <label>Password</label>
                    <input type="password" {...register("password")} className={style.glassButton} placeholder="Password"/>
                    {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
                </div>

                <div className="flex flex-col">
                    <label>Confirm password</label>
                    <input type="password" {...register("password2")} className={style.glassButton} placeholder="Confirm Password"/>
                    {errors.password2 && <span style={errorStyle}>{errors.password2.message}</span>}
                </div>
                <p className="text-center" style={{color : "var(--primary)"}}>
                    Already have an account? <Link to="/auth/login" className="hover:underline">Sign in</Link>
                </p>
                <div className="w-full flex justify-center">
                    <button type="submit" disabled={isSubmitting} className={style.glassButton} >
                    {isSubmitting ? "Creating account..." : "Create account"}
                    </button>
                </div>
            </form>
        </div>
    </CrystalMist>
  );
};

const errorStyle = { color: "#c00", fontSize: 12, marginTop: 4, display: "block" };

export default RegisterPage;