import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { confirmPasswordReset } from "../../api/auth";
import axios from "axios";
import type { ResetForm } from "../../types/authTypes";


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
      <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
        <h1>Invalid link</h1>
        <p style={{ color: "#555" }}>This reset link is invalid or has expired.</p>
        <Link to="/forgot-password">Request a new one</Link>
      </div>
    );
  }

  const onSubmit = async (data: ResetForm) => {
    setServerError(null);
    try {
      await confirmPasswordReset({ uid, token, ...data });
      navigate("/login", { state: { message: "Password reset successful. Please sign in." } });
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
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h1>Reset password</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Enter your new password below.</p>

      {serverError && (
        <div style={{ background: "#fee", padding: 12, borderRadius: 6, marginBottom: 16, color: "#c00" }}>
          {serverError} {" "}
          <Link to="/forgot-password" style={{ color: "#c00" }}>Request a new link</Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label>New password</label>
          <input type="password" {...register("new_password")} style={inputStyle} />
          {errors.new_password && <span style={errorStyle}>{errors.new_password.message}</span>}
        </div>

        <div>
          <label>Confirm new password</label>
          <input type="password" {...register("new_password2")} style={inputStyle} />
          {errors.new_password2 && <span style={errorStyle}>{errors.new_password2.message}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  display: "block", width: "100%", padding: "10px 12px",
  border: "1px solid #ddd", borderRadius: 6, marginTop: 4,
  fontSize: 14, boxSizing: "border-box" as const,
};
const errorStyle = { color: "#c00", fontSize: 12, marginTop: 4, display: "block" };
const buttonStyle = {
  padding: "12px", background: "#111", color: "#fff",
  border: "none", borderRadius: 6, cursor: "pointer", fontSize: 15,
};

export default ResetPasswordPage;