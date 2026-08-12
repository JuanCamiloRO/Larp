import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyAgreement, setPrivacyAgreement] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSignUp(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !password || !trimmedUsername) {
      setError("Please fill in all fields.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (trimmedUsername.length < 2) {
      setError("Username must have at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setError("Password must have at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (!privacyAgreement) {
      setError("You must accept the Privacy Policy and Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } =
        await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("Could not create your account. Please try again.");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            username: trimmedUsername,
            onboarding_completed: false,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        throw profileError;
      }

      navigate("/onboarding", { replace: true });
    } catch (error) {
      console.error("Sign up error:", error);

      setError(
        error.message || "Could not create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <div className="panel">
        <div className="panel-header">
          <span className="brand">Larp</span>

          <Link
            to="/"
            className="icon-btn"
            aria-label="Go back to home"
          >
            ←
          </Link>
        </div>

        <h1 className="page-title">Create account</h1>

        <p className="subtle">
          Create your account, complete your profile, and start tracking your
          progress.
        </p>

        <form onSubmit={handleSignUp}>
          <div className="form-grid">
            <input
              className="input-field"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={20}
              autoComplete="username"
            />

            <input
              className="input-field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />

            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />

            <input
              className="input-field"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingBottom: 20,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={privacyAgreement}
              onChange={(event) =>
                setPrivacyAgreement(event.target.checked)
              }
            />

            <span>
              I accept the{" "}
              <Link
                to="/privacy-legal"
                onClick={(event) => event.stopPropagation()}
                style={{ color: "#ff3b30" }}
              >
                Privacy Policy and Terms of Service
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="primary-btn"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {error && (
          <p
            style={{
              marginTop: 12,
              color: "#ef4444",
              fontSize: 14,
            }}
          >
            {error}
          </p>
        )}

        <p className="small-text" style={{ marginTop: 16 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#ff3b30" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}