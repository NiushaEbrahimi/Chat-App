import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { TriangleAlert } from "lucide-react";

import { confirmPasswordReset } from "../../api/auth";
import type { ResetForm } from "../../types/authTypes";
import CrystalMist from "../../shared/CrystalMist";
import style from "../../assets/css/CrystalMist.module.css";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetForm>();

  // invalid link — uid or token missing from URL
  if (!uid || !token) {
    return (
      <CrystalMist header={<h1>Reset password</h1>}>
      <div 
        className="p-4 m-2"
      >
        <h1 className="text-2xl flex flex-row" style={{ color: "var(--secondary)" }}>
          <TriangleAlert size={28} className="mr-2" />
          Invalid link
        </h1>
        <p style={{ color: "var(--secondary-faded)" }} className="mt-2">
          This reset link is invalid or has expired.
        </p>
        <Link to="/auth/forget-password" style={{ color: "var(--primary)" }} className="mt-6 inline-block underline">
          Request a new one
        </Link>
      </div>
      </CrystalMist>
    );
  }

  const onSubmit = async (data: ResetForm) => {
    setServerError(null);
    try {
      await confirmPasswordReset({ uid, token, ...data });
      navigate("/auth/login", { state: { message: "Password reset successful. Please sign in." } });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data;
        if (detail?.token) {
          setServerError("This link has expired or already been used. Request a new one.");
        } else {
          setServerError("Something went wrong. Please try again.");
        }
      }
    }
  };

  return (
    <CrystalMist header={<h1>Reset password</h1>}>
    <div className="p-4 m-2">
      <p className="mt-2" style={{ color: "var(--primary)" }}>Enter your new password below.</p>

      {serverError && (
        <div 
          style={{ background: "var(--secondary-faded)", color: "var(--primary)" }}
          className="flex items-center p-3 gap-2 rounded-xl mt-4"
        >
          {serverError} {" "}
          <Link to="/auth/forget-password" style={{ color: "var(--primary)" }}>Request a new link</Link>
        </div>
      )}

      <form 
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
      >
        <div>
          <label>New password</label>
          <input type="password" {...register("new_password")} className={`${style.glassButton} mt-2 w-full`} />
          {errors.new_password && <span className="text-red-500 text-sm mt-1">{errors.new_password.message}</span>}
        </div>

        <div>
          <label>Confirm new password</label>
          <input type="password" {...register("new_password2")} className={`${style.glassButton} mt-2 w-full`} />
          {errors.new_password2 && <span className="text-red-500 text-sm mt-1">{errors.new_password2.message}</span>}
        </div>
        <div className="w-full flex justify-center">
          <button type="submit" disabled={isSubmitting} className={`${style.glassButton} mt-2`}>
            {isSubmitting ? "Resetting..." : "Reset password"}
          </button>
        </div>
      </form>
    </div>
    </CrystalMist>
  );
};

export default ResetPasswordPage;