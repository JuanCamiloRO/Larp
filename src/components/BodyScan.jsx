// src/components/BodyScan.jsx
import { useState, useRef } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { calcularScores } from "../lib/poseUtils";
import { supabase } from '../supabase';
import "../css/style.css";

function BodyScan() {
  const [foto, setFoto] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const imagenRef = useRef(null);

  const handleFoto = (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
      setFoto(URL.createObjectURL(archivo));
      setResultado(null);
    }
  };

  async function crearDetector() {
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

  const procesarFoto = async () => {
    setCargando(true);
    const detector = await crearDetector();
    const deteccion = detector.detect(imagenRef.current);

    if (!deteccion.landmarks || deteccion.landmarks.length === 0) {
      alert("No se detectó un cuerpo, repite la foto con mejor luz/postura.");
      setCargando(false);
      return;
    }

    const puntos = deteccion.landmarks[0];
    const scores = calcularScores(puntos);
    setResultado(scores);

    await supabase.from("body_scans").insert({
      user_id: (await supabase.auth.getUser()).data.user.id,
      score_simetria: scores.scoreSimetria,
      score_estructura: scores.scoreEstructura,
      score_postura: scores.scorePostura,
      score_total: scores.scoreTotal,
      ratio_hombro_cadera: scores.ratioHombroCadera,
    });

    setCargando(false);
  };

  const getColor = (val) => {
    if (val >= 80) return "#22c55e";
    if (val >= 60) return "#3b82f6";
    if (val >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getGlow = (val) => {
    if (val >= 80) return "rgba(34,197,94,0.4)";
    if (val >= 60) return "rgba(59,130,246,0.4)";
    if (val >= 40) return "rgba(245,158,11,0.4)";
    return "rgba(239,68,68,0.4)";
  };

  return (
    <section className="section-card bodyscan-card">
      <div className="bodyscan-header">
        <div>
          <p className="brand">BodyScan</p>
          <h2 className="page-title bodyscan-title">Escanea tu cuerpo</h2>
          <p className="subtle">De frente, brazos ligeramente separados, buena luz y ropa ajustada.</p>
        </div>
      </div>

      <div className="bodyscan-controls">
        <label className="bodyscan-upload-button">
          <span>Elegir foto</span>
          <input type="file" accept="image/*" onChange={handleFoto} />
        </label>

        <button
          className="primary-btn bodyscan-analyze-button"
          onClick={procesarFoto}
          disabled={cargando || !foto}
        >
          {cargando ? "Procesando..." : "Analizar"}
        </button>
      </div>

      {foto && !resultado && (
        <div className="bodyscan-preview">
          <img
            ref={imagenRef}
            src={foto}
            alt="foto body scan"
            className="bodyscan-image"
          />
        </div>
      )}

      {resultado && (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 360,
            margin: "24px auto 0",
            aspectRatio: "2/3",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            background: "#0a0a0a",
          }}
        >
          <img
            src={foto}
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

          {/* Overall en blanco con barra */}
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
                fontSize: 48,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              }}
            >
              {Math.round(resultado.scoreTotal)}
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
                  width: `${Math.round(resultado.scoreTotal)}%`,
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
                color: "rgba(255,255,255,0.6)",
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Overall
            </span>
          </div>

          {/* Título */}
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

          {/* Stats */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              padding: "24px 20px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: "linear-gradient(0deg, rgba(0,0,0,0.92), rgba(0,0,0,0.3))",
            }}
          >
            {[
              { label: "Simetría", val: Math.round(resultado.scoreSimetria) },
              { label: "Estructura", val: Math.round(resultado.scoreEstructura) },
              { label: "Postura", val: Math.round(resultado.scorePostura) },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 80,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {s.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${s.val}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: getColor(s.val),
                      boxShadow: `0 0 8px ${getGlow(s.val)}`,
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 28,
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 800,
                    color: getColor(s.val),
                  }}
                >
                  {s.val}
                </span>
              </div>
            ))}

            <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.08)", marginTop: 4 }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Ratio Hombro/Cadera
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)" }}>
                {resultado.ratioHombroCadera?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {resultado && (
        <div className="bodyscan-controls" style={{ marginTop: 16 }}>
          <button
            className="primary-btn bodyscan-analyze-button"
            onClick={() => { setResultado(null); setFoto(null); }}
          >
            Escanear de nuevo
          </button>
        </div>
      )}
    </section>
  );
}

export default BodyScan;