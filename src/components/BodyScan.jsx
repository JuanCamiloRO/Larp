import { useState, useRef, useCallback, useEffect } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { calcularScores, calcularMasaDef } from "../lib/poseUtils";
import { supabase } from '../supabase';
import "../css/style.css";

function BodyScan({ onClose }) {
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ weight: "", height: "", bodyFat: "", gender: "H" });
  const [inputKey, setInputKey] = useState(0);
  const imageRef = useRef(null);

  // Preload weight and height from the profile on mount
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("weight, height, body_fat, gender")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Could not load existing profile:", error.message);
        return;
      }

      if (data) {
        setProfile((p) => ({
          ...p,
          weight: data.weight?.toString() || "",
          height: data.height?.toString() || "",
          bodyFat: data.body_fat?.toString() || "",
          gender: data.gender === "female" ? "M" : "H",
        }));
      }
    }
    loadProfile();
  }, []);

  const resetAll = useCallback(() => {
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(null);
    setResult(null);
    setLoading(false);
    setInputKey((k) => k + 1);
    onClose?.();
  }, [photo, onClose]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    setResult(null);
  };

  const handleProfile = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  async function createDetector() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      },
      runningMode: "IMAGE",
    });
  }

  const processPhoto = async () => {
    if (!imageRef.current) return;
    setLoading(true);

    try {
      // 1. Get the user ONCE
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("Invalid session. Please sign in again.");
        setLoading(false);
        return;
      }

      const detector = await createDetector();
      const detection = detector.detect(imageRef.current);

      if (!detection.landmarks || detection.landmarks.length === 0) {
        alert("No body detected — retake the photo with better lighting/posture.");
        setLoading(false);
        return;
      }

      const landmarks = detection.landmarks[0];
      const scores = calcularScores(landmarks);

      const p = profile;
      const hasProfile = p.weight && p.height && p.bodyFat;
      let muscleScore = null;
      let definitionScore = null;

      if (hasProfile) {
        const md = calcularMasaDef(Number(p.weight), Number(p.height), Number(p.bodyFat), p.gender);
        muscleScore = md.scoreMusc;
        definitionScore = md.scoreDef;
      }

      const overall = Math.round(
        scores.scorePotencial * 0.30 +
        scores.scoreSimetria * 0.25 +
        scores.scorePostura * 0.25 +
        (muscleScore !== null ? muscleScore * 0.10 : 0) +
        (definitionScore !== null ? definitionScore * 0.10 : 0)
      );

      const finalResult = { ...scores, scoreMusc: muscleScore, scoreDef: definitionScore, scoreTotal: overall };
      setResult(finalResult);

      // 2. Save the scan to body_scans
      const { error: scanError } = await supabase.from("body_scans").insert({
        user_id: user.id,
        score_potencial: finalResult.scorePotencial,
        score_simetria: finalResult.scoreSimetria,
        score_postura: finalResult.scorePostura,
        score_musc: finalResult.scoreMusc,
        score_def: finalResult.scoreDef,
        score_total: finalResult.scoreTotal,
      });

      if (scanError) {
        console.error("Error saving body_scans:", scanError);
        alert("Error saving the scan: " + scanError.message);
      }

      // 3. Save weight and height to profiles
      if (profile.weight && profile.height) {
        const updates = {
          weight: Number(profile.weight),
          height: Number(profile.height),
        };
        if (profile.bodyFat) {
          updates.body_fat = Number(profile.bodyFat);
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
          alert("Error saving weight/height to profile: " + profileError.message);
        } else {
          console.log("✅ Profile updated successfully:", updates);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error analyzing photo. Please try a different one.");
    } finally {
      setLoading(false);
    }
  };

  const getColor = (val) => {
    if (val === null) return "#64748b";
    if (val >= 80) return "#22c55e";
    if (val >= 60) return "#3b82f6";
    if (val >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const stats = result
    ? [
        { abbr: "POT", label: "Potential", val: result.scorePotencial },
        { abbr: "SYM", label: "Symmetry", val: result.scoreSimetria },
        { abbr: "POS", label: "Posture", val: result.scorePostura },
        ...(result.scoreMusc !== null
          ? [
              { abbr: "MUSC", label: "Muscle", val: result.scoreMusc },
              { abbr: "DEF", label: "Definition", val: result.scoreDef },
            ]
          : []),
      ]
    : [];

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    outline: "none",
    boxSizing: "border-box",
    WebkitAppearance: "none",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    display: "block",
  };

  return (
    <section className="section-card bodyscan-card">
      <div className="bodyscan-header">
        <div>
          <p className="brand">BodyScan</p>
          <h2 className="page-title bodyscan-title">Scan your body</h2>
          <p className="subtle">Face forward, arms slightly apart and good lightning.</p>
        </div>
      </div>

      <div className="bodyscan-controls">
        <label className="bodyscan-upload-button" htmlFor="bodyscan-input">
          <span>Choose photo</span>
        </label>
        <input
          id="bodyscan-input"
          key={inputKey}
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          style={{ display: "none" }}
        />

        <button
          className="primary-btn bodyscan-analyze-button"
          onClick={processPhoto}
          disabled={loading || !photo}
        >
          {loading ? "Processing..." : "Analyze"}
        </button>
      </div>

      <div style={{ maxWidth: 340, width: "100%", marginTop: 20 }}>
        <p style={{ ...labelStyle, marginBottom: 10 }}>Optional details</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 12px" }}>
          <div>
            <label style={labelStyle}>Weight (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="70"
              value={profile.weight}
              onChange={(e) => handleProfile("weight", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Height (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="175"
              value={profile.height}
              onChange={(e) => handleProfile("height", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Body fat %</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="18"
              value={profile.bodyFat}
              onChange={(e) => handleProfile("bodyFat", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Sex</label>
            <select
              value={profile.gender}
              onChange={(e) => handleProfile("gender", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="H" style={{ background: "#1e293b", color: "#fff" }}>Male</option>
              <option value="M" style={{ background: "#1e293b", color: "#fff" }}>Female</option>
            </select>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "10px 0 0", lineHeight: 1.4 }}>
          Fill in these fields to unlock Muscle and Definition on your card.
        </p>
      </div>

      {photo && !result && (
        <div className="bodyscan-preview">
          <img
            ref={imageRef}
            src={photo}
            alt="body scan photo"
            className="bodyscan-image"
          />
        </div>
      )}

      {result && (
        <>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 340,
              margin: "28px auto 0",
              aspectRatio: "2/3",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
              background: "#0a0a0a",
            }}
          >
            <img
              src={photo}
              alt="body scan"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.4) contrast(1.1)",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.85) 100%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: "#fff",
                  lineHeight: 1,
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                }}
              >
                {result.scoreTotal}
              </span>
              <div
                style={{
                  width: 56,
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.15)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${result.scoreTotal}%`,
                    height: "100%",
                    borderRadius: 2,
                    background: "#fff",
                    boxShadow: "0 0 8px rgba(255,255,255,0.5)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Overall
              </span>
            </div>

            <div style={{ position: "absolute", top: 24, left: 20 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.9)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}
              >
                Body Scan
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                top: 100,
                left: 20,
                width: 40,
                height: 2,
                background: "rgba(255,255,255,0.3)",
                borderRadius: 1,
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                padding: "20px",
                background: "linear-gradient(0deg, rgba(0,0,0,0.92), rgba(0,0,0,0.3))",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px 16px",
                }}
              >
                {stats.map((s) => (
                  <div key={s.abbr} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: getColor(s.val),
                        width: 42,
                        letterSpacing: 0.5,
                      }}
                    >
                      {s.abbr}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: s.val !== null ? `${s.val}%` : "0%",
                          height: "100%",
                          borderRadius: 3,
                          background: getColor(s.val),
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: s.val !== null ? "#fff" : "#64748b",
                        width: 26,
                        textAlign: "right",
                      }}
                    >
                      {s.val !== null ? s.val : "--"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bodyscan-controls" style={{ marginTop: 16 }}>
            <button
              className="primary-btn bodyscan-analyze-button"
              onClick={resetAll}
            >
              Scan again
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default BodyScan;