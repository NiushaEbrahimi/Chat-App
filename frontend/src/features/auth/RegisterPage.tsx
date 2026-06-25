import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {TriangleAlert, User, Mail , Lock} from "lucide-react"

import { registerUser } from "../../api/auth";
import type { SignUpPayload } from "../../types/authTypes";
import CrystalMist from "../../shared/CrystalMist";
import style from "../../assets/css/CrystalMist.module.css"
import Spinner from "../../shared/Spinner";

// TODO: This form is pretty basic, we should add password strength meter and other quality of life features

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpPayload>();

  const onSubmit = async (data : SignUpPayload) => {
    setServerError(null);
    try {
      await registerUser(data);
      navigate("/auth/login", { state: { message: "Account created! Please log in." } });
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

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
                <div className="flex flex-col">
                    <label className="flex items-center">
                        <Mail size={20} className="mr-2" />
                        Email
                    </label>
                    <input type="email" {...register("email")} className={`${style.glassButton} mt-2`} placeholder="Email"/>
                    {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                </div>

                <div className="flex flex-col">
                    <label className="flex items-center">
                        <User size={20} className="mr-2" />
                        Username
                    </label>
                    <input type="text" {...register("username")} className={`${style.glassButton} mt-2`} placeholder="Username"/>
                    {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
                </div>

                <div className="flex flex-col">
                    <label className="flex items-center">
                        <Lock size={20} className="mr-2" />
                        Password
                    </label>
                    <input type="password" {...register("password")} className={`${style.glassButton} mt-2`} placeholder="Password"/>
                    {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
                </div>

                <div className="flex flex-col">
                    <label className="flex items-center">
                        <Lock size={20} className="mr-2" />
                        Confirm Password
                    </label>
                    <input type="password" {...register("password2")} className={`${style.glassButton} mt-2`} placeholder="Confirm Password"/>
                    {errors.password2 && <span className="text-red-500 text-sm">{errors.password2.message}</span>}
                </div>
                <p className="text-center" style={{color : "var(--primary)"}}>
                    Already have an account? <Link to="/auth/login" className="hover:underline">Sign in</Link>
                </p>
                <div className="w-full flex justify-center">
                    <button type="submit" disabled={isSubmitting} className={`${style.glassButton} mt-2`} >
                    {isSubmitting ? <Spinner/> : "Create account"}
                    </button>
                </div>
            </form>
        </div>
    </CrystalMist>
  );
};

export default RegisterPage;