// AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AuthCallback() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/onboarding", { replace: true });
    } else {
      // link expired, already used, or something went wrong
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  return <div className="screen"><p>Verifying...</p></div>;
}