import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth.ts";
import type { ForgotForm } from "../../types/authTypes";
import CrystalMist from "../../shared/CrystalMist.tsx";
import style from "../../assets/css/CrystalMist.module.css"

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
        <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
          <p style={{ color: "#555", lineHeight: 1.6 }}>
            If an account exists for that email or username, you'll receive a
            password reset link shortly. Check your spam folder if you don't see it.
          </p>
          <Link to="/login" style={{ display: "block", marginTop: 24, color: "#111" }}>
            ← Back to sign in
          </Link>
        </div>
      </CrystalMist>
    );
  }

  return (
    <CrystalMist header={<h1>Check your email</h1>}>
      <div className="p-2 flex flex-col gap-3">
        <h1>Forgot password</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Enter your email or username and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label>Email or username</label>
            <input type="text" {...register("identifier")} style={inputStyle} />
            {errors.identifier && <span style={errorStyle}>{errors.identifier.message}</span>}
          </div>

          <div className="flex justify-center">
            <button type="submit" disabled={isSubmitting} className={style.glassButton}>
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </form>

        <Link to="/login" className="text-center" style={{ display: "block", marginTop: 16, fontSize: 13, color: "var(--primary)" }}>
          ← Back to sign in
        </Link>
      </div>
    </CrystalMist>
  );
};

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px",
  border: "1px solid #ddd", borderRadius: 6, marginTop: 4,
  fontSize: 14, boxSizing: "border-box" as const,
};
const errorStyle = { color: "#c00", fontSize: 12, marginTop: 4, display: "block" };

export default ForgotPasswordPage;