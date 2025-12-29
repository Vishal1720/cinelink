import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useNavigate } from "react-router-dom";
import Landingheader from "./Landingheader";
import "./ResetPassword.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //Ensure page opened via recovery link
  useEffect(() => {
    if (!window.location.hash.includes("type=recovery")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password updated successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    }

    setLoading(false);
  };

  return (
    <>
      <Landingheader />

      <div className="reset-password-page">
        <div className="reset-password-card">
          <h2 className="reset-password-title">Reset Password</h2>

          <form
            className="reset-password-form"
            onSubmit={handleReset}
          >
            <input
              type="password"
              className="reset-password-input"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              className="reset-password-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && (
              <p className="reset-password-error">{error}</p>
            )}

            {success && (
              <p className="reset-password-success">{success}</p>
            )}

            <button
              type="submit"
              className="reset-password-btn"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
