import { useState } from "react";
import { supabase } from "./supabase";
import Landingheader from "./Landingheader";
import './ForgotPassword.css';
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset link sent. Check your email.");
    }

    setLoading(false);
  };

  return (
    <>
      <Landingheader />
      <div className="forgot-card">
        <h2>Forgot Password</h2>

        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}

          <button type="submit" disabled={loading} className="forgot-password-btn">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </>
  );
};

export default ForgotPassword;
