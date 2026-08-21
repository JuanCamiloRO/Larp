import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useNavigate } from "react-router-dom";
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

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

function calculateMaintenanceCalories({ age, weight, height, gender, experience, goal, frequency }) {
  const parsedAge = Number(age);
  const parsedWeight = Number(weight);
  const parsedHeight = Number(height);
  const parsedFrequency = Number(frequency);

  if ([parsedAge, parsedWeight, parsedHeight, parsedFrequency].some((v) => Number.isNaN(v) || v <= 0)) {
    return null;
  }

  const genderConstant = { male: 5, female: -31 }[gender] ?? -78;
  const baseBmr = 10 * parsedWeight + 6.25 * parsedHeight - 5 * parsedAge + genderConstant;
  const activityMultiplier = { 2: 1.2, 3: 1.375, 4: 1.55, 5: 1.725, 6: 1.9 }[parsedFrequency] || 1.2;
  const trainingAdjustment = { beginner: 0.95, intermediate: 1, advanced: 1.05 }[experience] || 1;
  const goalAdjustment = { muscle: 200, fatloss: -600, strength: 400, maintain: 0 }[goal] || 0;

  return Math.max(1200, Math.round(baseBmr * activityMultiplier * trainingAdjustment + goalAdjustment));
}

export default function OnBoardingSignUp() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: "",
    age: "",
    gender: "",
    weight: "",
    height: "",
    experience: "",
    goal: "",
    frequency: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setData((d) => ({
        ...d,
        name: profile.name || d.name,
        age: profile.age ? String(profile.age) : d.age,
        gender: profile.gender || d.gender,
        weight: profile.weight ? String(profile.weight) : d.weight,
        height: profile.height ? String(profile.height) : d.height,
      }));
    }
  }, [profile]);

  if (!user) return <div className="onboarding-signup-page">Loading session...</div>;
  if (profileLoading) return <div className="onboarding-signup-page">Loading...</div>;

  const totalSteps = 8;

  const update = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const canAdvance = () => {
    switch (step) {
      case 0: return data.name.trim().length >= 2;
      case 1: return data.age && Number(data.age) >= 13 && Number(data.age) <= 99;
      case 2: return !!data.gender;
      case 3: return data.weight && Number(data.weight) >= 30 && Number(data.weight) <= 250;
      case 4: return data.height && Number(data.height) >= 100 && Number(data.height) <= 250;
      case 5: return !!data.experience;
      case 6: return !!data.goal;
      case 7: return !!data.frequency;
      default: return true;
    }
  };

  const next = () => { if (canAdvance() && step < totalSteps - 1) setStep((s) => s + 1); };
  const back = () => { if (step > 0) setStep((s) => s - 1); };

  const finish = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const maintenanceCalories = calculateMaintenanceCalories(data);

      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          age: Number(data.age),
          gender: data.gender,
          weight: Number(data.weight),
          height: Number(data.height),
          experience: data.experience,
          goal: data.goal,
          frequency: Number(data.frequency),
          daily_calorie_goal: maintenanceCalories,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error saving data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / totalSteps) * 100;

  const inputStyle = {
    width: "100%", padding: "18px 20px", borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    color: "#fff", fontSize: 20, fontWeight: 700, outline: "none",
    boxSizing: "border-box", textAlign: "center", WebkitAppearance: "none",
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (<><h2 style={titleStyle}>What's your name?</h2><p style={descStyle}>This will appear on your public profile.</p><input type="text" placeholder="Your name" value={data.name} onChange={(e) => update("name", e.target.value)} style={{ ...inputStyle, textAlign: "left", fontSize: 18 }} maxLength={20} /></>);
      case 1: return (<><h2 style={titleStyle}>What's your age?</h2><p style={descStyle}>We need this to adjust your basal metabolism.</p><input type="number" inputMode="decimal" placeholder="25" value={data.age} onChange={(e) => update("age", e.target.value)} style={inputStyle} /></>);
      case 2: return (<><h2 style={titleStyle}>What's your gender?</h2><p style={descStyle}>This affects your basal metabolism calculation.</p><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{GENDERS.map((g) => (<button key={g.value} onClick={() => update("gender", g.value)} style={{ padding: "18px 20px", borderRadius: 14, border: data.gender === g.value ? "1px solid #ff3b30" : "1px solid rgba(255,255,255,0.08)", background: data.gender === g.value ? "rgba(255,59,48,0.1)" : "rgba(255,255,255,0.03)", color: "#fff", textAlign: "left", cursor: "pointer" }}><span style={{ fontSize: 15, fontWeight: 800 }}>{g.label}</span></button>))}</div></>);
      case 3: return (<><h2 style={titleStyle}>How much do you weigh?</h2><p style={descStyle}>We'll use this to calculate your FFMI and track your progress.</p><div style={{ position: "relative" }}><input type="number" inputMode="decimal" placeholder="78" value={data.weight} onChange={(e) => update("weight", e.target.value)} style={inputStyle} /><span style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700 }}>kg</span></div></>);
      case 4: return (<><h2 style={titleStyle}>How tall are you?</h2><p style={descStyle}>We'll use this to calculate your BMI and proportions.</p><div style={{ position: "relative" }}><input type="number" inputMode="decimal" placeholder="175" value={data.height} onChange={(e) => update("height", e.target.value)} style={inputStyle} /><span style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700 }}>cm</span></div></>);
      case 5: return (<><h2 style={titleStyle}>What's your level?</h2><p style={descStyle}>Be honest, this affects your recommendations.</p><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{EXPERIENCE_LEVELS.map((lvl) => (<button key={lvl.value} onClick={() => update("experience", lvl.value)} style={{ padding: "18px 20px", borderRadius: 14, border: data.experience === lvl.value ? "1px solid #ff3b30" : "1px solid rgba(255,255,255,0.08)", background: data.experience === lvl.value ? "rgba(255,59,48,0.1)" : "rgba(255,255,255,0.03)", color: "#fff", textAlign: "left", cursor: "pointer" }}><span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{lvl.label}</span><span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{lvl.desc}</span></button>))}</div></>);
      case 6: return (<><h2 style={titleStyle}>What's your goal?</h2><p style={descStyle}>We'll personalize your plan based on this.</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{GOALS.map((g) => (<button key={g.value} onClick={() => update("goal", g.value)} style={{ padding: "24px 12px", borderRadius: 14, border: data.goal === g.value ? "1px solid #ff3b30" : "1px solid rgba(255,255,255,0.08)", background: data.goal === g.value ? "rgba(255,59,48,0.1)" : "rgba(255,255,255,0.03)", color: "#fff", textAlign: "center", cursor: "pointer" }}><span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>{g.icon}</span><span style={{ fontSize: 14, fontWeight: 800 }}>{g.label}</span></button>))}</div></>);
      case 7: return (<><h2 style={titleStyle}>How many days a week do you train?</h2><p style={descStyle}>We'll suggest the optimal routine for you.</p><p style={{ ...descStyle, marginBottom: 12 }}>Based on your info, we'll set your calorie goal to about {calculateMaintenanceCalories(data) || "..."} kcal/day.</p><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{FREQUENCIES.map((f) => (<button key={f.value} onClick={() => update("frequency", f.value)} style={{ padding: "16px 20px", borderRadius: 14, border: Number(data.frequency) === f.value ? "1px solid #ff3b30" : "1px solid rgba(255,255,255,0.08)", background: Number(data.frequency) === f.value ? "rgba(255,59,48,0.1)" : "rgba(255,255,255,0.03)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}><span style={{ fontSize: 15, fontWeight: 800 }}>{f.label} <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500 }}>/ week</span></span><span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{f.desc}</span></button>))}</div></>);
      default: return null;
    }
  };

  const isLastStep = step === totalSteps - 1;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#000000", zIndex: 2000, display: "flex", flexDirection: "column" }}>
      <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.05)" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #ff3b30, #cc2a20)", transition: "width 0.4s ease" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 24px 100px", maxWidth: 400, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {renderStep()}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", padding: "20px 24px 32px", background: "linear-gradient(0deg, #000000 60%, transparent)", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#ff3b30" : i < step ? "rgba(255,59,48,0.4)" : "rgba(255,255,255,0.1)", transition: "all 0.3s ease" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, maxWidth: 400, margin: "0 auto", width: "100%" }}>
          {step > 0 && <button onClick={back} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Back</button>}
          <button onClick={isLastStep ? finish : next} disabled={!canAdvance() || saving} style={{ flex: step > 0 ? 2 : 1, padding: "14px", borderRadius: 12, border: "none", background: canAdvance() && !saving ? "linear-gradient(135deg, #ff3b30, #cc2a20)" : "#1a1a1a", color: canAdvance() && !saving ? "#ffffff" : "#888888", fontSize: 14, fontWeight: 800, cursor: canAdvance() && !saving ? "pointer" : "not-allowed" }}>
            {saving ? "Saving..." : isLastStep ? "Start!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

const titleStyle = { fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 8px", lineHeight: 1.1 };
const descStyle = { fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 32px", lineHeight: 1.4 };