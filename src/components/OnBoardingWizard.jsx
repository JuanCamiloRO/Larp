import { useState } from "react";
import { supabase } from "../supabase";
import "../css/style.css";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Less than 6 months training" },
  { value: "intermediate", label: "Intermediate", desc: "6 months - 2 years" },
  { value: "advanced", label: "Advanced", desc: "More than 2 years" },
];

const GOALS = [
  { value: "muscle", label: "Gain Muscle", icon: "💪" },
  { value: "fatloss", label: "Lose Fat", icon: "🔥" },
  { value: "strength", label: "Strength", icon: "🏋️" },
  { value: "maintain", label: "Maintain", icon: "⚖️" },
];

const FREQUENCIES = [
  { value: 2, label: "2 days", desc: "Light" },
  { value: 3, label: "3 days", desc: "Calisthenic" },
  { value: 4, label: "4 days", desc: "Serious" },
  { value: 5, label: "5 days", desc: "Locked in" },
  { value: 6, label: "6 days", desc: "Larper" },
];

function OnboardingWizard({ userId, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    username: "",
    age: "",
    weight: "",
    height: "",
    experience: "",
    goal: "",
    frequency: "",
  });
  const [saving, setSaving] = useState(false);

  const totalSteps = 7;

  const update = (field, value) => {
    setData((d) => ({ ...d, [field]: value }));
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return data.username.trim().length >= 2;
      case 1: return data.age && Number(data.age) >= 13 && Number(data.age) <= 99;
      case 2: return data.weight && Number(data.weight) >= 30 && Number(data.weight) <= 250;
      case 3: return data.height && Number(data.height) >= 100 && Number(data.height) <= 250;
      case 4: return !!data.experience;
      case 5: return !!data.goal;
      case 6: return !!data.frequency;
      default: return true;
    }
  };

  const next = () => {
    if (!canAdvance()) return;
    if (step < totalSteps - 1) setStep((s) => s + 1);
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const finish = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          age: Number(data.age),
          weight: Number(data.weight),
          height: Number(data.height),
          experience: data.experience,
          goal: data.goal,
          frequency: Number(data.frequency),
          onboarding_completed: true,
        })
        .eq("id", userId);

      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error(err);
      alert("Error saving data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / totalSteps) * 100;

  const inputStyle = {
    width: "100%",
    padding: "18px 20px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 700,
    outline: "none",
    boxSizing: "border-box",
    textAlign: "center",
    WebkitAppearance: "none",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    display: "block",
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <h2 style={titleStyle}>What's your name?</h2>
            <p style={descStyle}>This will appear on your public profile.</p>
            <input
              type="text"
              placeholder="Your name"
              value={data.username}
              onChange={(e) => update("username", e.target.value)}
              style={{ ...inputStyle, textAlign: "left", fontSize: 18 }}
              maxLength={20}
            />
          </>
        );

      case 1:
        return (
          <>
            <h2 style={titleStyle}>What's your age?</h2>
            <p style={descStyle}>We need this to adjust your basal metabolism.</p>
            <input
              type="number"
              inputMode="decimal"
              placeholder="25"
              value={data.age}
              onChange={(e) => update("age", e.target.value)}
              style={inputStyle}
            />
          </>
        );

      case 2:
        return (
          <>
            <h2 style={titleStyle}>How much do you weigh?</h2>
            <p style={descStyle}>We'll use this to calculate your FFMI and track your progress.</p>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                inputMode="decimal"
                placeholder="78"
                value={data.weight}
                onChange={(e) => update("weight", e.target.value)}
                style={inputStyle}
              />
              <span style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700 }}>kg</span>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 style={titleStyle}>How tall are you?</h2>
            <p style={descStyle}>We'll use this to calculate your BMI and proportions.</p>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                inputMode="decimal"
                placeholder="175"
                value={data.height}
                onChange={(e) => update("height", e.target.value)}
                style={inputStyle}
              />
              <span style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700 }}>cm</span>
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2 style={titleStyle}>What's your level?</h2>
            <p style={descStyle}>Be honest, this affects your recommendations.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  onClick={() => update("experience", lvl.value)}
                  style={{
                    padding: "18px 20px",
                    borderRadius: 14,
                    border: data.experience === lvl.value ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.08)",
                    background: data.experience === lvl.value ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{lvl.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{lvl.desc}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 5:
        return (
          <>
            <h2 style={titleStyle}>What's your goal?</h2>
            <p style={descStyle}>We'll personalize your plan based on this.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => update("goal", g.value)}
                  style={{
                    padding: "24px 12px",
                    borderRadius: 14,
                    border: data.goal === g.value ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.08)",
                    background: data.goal === g.value ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                    color: "#fff",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>{g.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{g.label}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 6:
        return (
          <>
            <h2 style={titleStyle}>How many days a week do you train?</h2>
            <p style={descStyle}>We'll suggest the optimal routine for you.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => update("frequency", f.value)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: Number(data.frequency) === f.value ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.08)",
                    background: Number(data.frequency) === f.value ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 800 }}>{f.label} <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500 }}>/ semana</span></span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#0f172a",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Barra de progreso */}
      <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.05)" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #d4af37, #b8860b)",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Contenido */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "24px 24px 100px",
          maxWidth: 400,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          animation: "fadeInUp 0.3s ease",
        }}
      >
        {renderStep()}
      </div>

      {/* Footer: navegación + indicadores */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "20px 24px 32px",
          background: "linear-gradient(0deg, #0f172a 60%, transparent)",
          boxSizing: "border-box",
        }}
      >
        {/* Indicadores de paso */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === step ? "#d4af37" : i < step ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto", width: "100%" }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "rgba(255,255,255,0.5)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Atrás
            </button>
          )}
          <button
            onClick={isLastStep ? finish : next}
            disabled={!canAdvance() || saving}
            style={{
              flex: step > 0 ? 2 : 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: canAdvance() && !saving ? "linear-gradient(135deg, #d4af37, #b8860b)" : "#334155",
              color: canAdvance() && !saving ? "#0a0a0a" : "#64748b",
              fontSize: 14,
              fontWeight: 800,
              cursor: canAdvance() && !saving ? "pointer" : "not-allowed",
              boxShadow: canAdvance() && !saving ? "0 4px 20px rgba(212,175,55,0.25)" : "none",
            }}
          >
            {saving ? "Saving..." : isLastStep ? "Start!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

const titleStyle = {
  fontSize: 28,
  fontWeight: 900,
  color: "#fff",
  margin: "0 0 8px",
  lineHeight: 1.1,
};

const descStyle = {
  fontSize: 14,
  color: "rgba(255,255,255,0.4)",
  margin: "0 0 32px",
  lineHeight: 1.4,
};

export default OnboardingWizard;