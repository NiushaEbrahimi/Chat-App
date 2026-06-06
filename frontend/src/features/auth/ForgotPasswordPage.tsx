import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth.ts";
import type { ForgotForm } from "../../types/authTypes";
import CrystalMist from "../../shared/CrystalMist.tsx";
import style from "../../assets/css/CrystalMist.module.css"
import { ArrowLeft, User } from "lucide-react";
import Spinner from "../../shared/Spinner.tsx";

const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    await requestPasswordReset(data.identifier);
    setSubmitted(true); // always show success — never reveal if user exists
  };

  if (submitted) {
    return (
      <CrystalMist header={<h1>Check your email</h1>}>
        <div className="p-2 m-4 gap-3 max-w-120">
          <p style={{ color: "var(--primary)", lineHeight: 1.6 }}>
            If an account exists for that email or username, you'll receive a
            password reset link shortly. Check your spam folder if you don't see it.
          </p>
          <Link to="/auth/login" className="mt-2 text-center flex flex-row justify-center items-center" style={{ color: "var(--secondary)" }}>
            <ArrowLeft size={20} className="mr-2" />
            <p>Back to sign in</p>
          </Link>
        </div>
      </CrystalMist>
    );
  }

  return (
    <CrystalMist header={<h1>Check your email</h1>}>
      <div className="p-2 flex flex-col gap-3">
        <h1 style={{ color: "var(--primary)" }}>Forgot password</h1>
        <p style={{ color: "var(--primary-faded)", marginBottom: 24 }}>
          Enter your email or username and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4" >
          <div>
            <label className="flex items-center">
              <User size={20} className="mr-2" /> Email or username
            </label>
            <input type="text" {...register("identifier")} className={`${style.glassButton} mt-2 w-full`} />
            {errors.identifier && <span className="text-red-500 text-sm mt-1">{errors.identifier.message}</span>}
          </div>

          <div className="flex justify-center">
            <button type="submit" disabled={isSubmitting} className={style.glassButton}>
              {isSubmitting ? <Spinner/>: "Send reset link"}
            </button>
          </div>
        </form>
        <Link to="/auth/login" className="text-center flex flex-row justify-center items-center" style={{ color: "var(--primary)" }}>
          <ArrowLeft size={20} className="mr-2" />
          <p>Back to sign in</p>
        </Link>
      </div>
    </CrystalMist>
  );
};


export default ForgotPasswordPage;