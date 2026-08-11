import { useState, useRef, useCallback, useEffect } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { calcularScores, calcularMasaDef } from "../lib/poseUtils";
import { supabase } from '../supabase';
import "../css/style.css";

function BodyScan({ onClose }) {
  const [foto, setFoto] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [perfil, setPerfil] = useState({ peso: "", altura: "", grasa: "", sexo: "H" });
  const [inputKey, setInputKey] = useState(0);
  const imagenRef = useRef(null);

  // Precargar peso y altura desde el perfil al montar
  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("weight, height, body_fat, gender")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("No se pudo cargar perfil previo:", error.message);
        return;
      }

      if (data) {
        setPerfil((p) => ({
          ...p,
          peso: data.weight?.toString() || "",
          altura: data.height?.toString() || "",
          grasa: data.body_fat?.toString() || "",
          sexo: data.gender === "female" ? "M" : "H",
        }));
      }
    }
    cargarPerfil();
  }, []);

  const resetearTodo = useCallback(() => {
    if (foto) URL.revokeObjectURL(foto);
    setFoto(null);
    setResultado(null);
    setCargando(false);
    setInputKey((k) => k + 1);
    onClose?.();
  }, [foto, onClose]);

  const handleFoto = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (foto) URL.revokeObjectURL(foto);
    setFoto(URL.createObjectURL(archivo));
    setResultado(null);
  };

  const handlePerfil = (campo, valor) => {
    setPerfil((p) => ({ ...p, [campo]: valor }));
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
    if (!imagenRef.current) return;
    setCargando(true);

    try {
      // 1. Obtener usuario UNA sola vez
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("Sesión no válida. Inicia sesión de nuevo.");
        setCargando(false);
        return;
      }

      const detector = await crearDetector();
      const deteccion = detector.detect(imagenRef.current);

      if (!deteccion.landmarks || deteccion.landmarks.length === 0) {
        alert("No se detectó un cuerpo, repite la foto con mejor luz/postura.");
        setCargando(false);
        return;
      }

      const puntos = deteccion.landmarks[0];
      const scores = calcularScores(puntos);

      const p = perfil;
      const tienePerfil = p.peso && p.altura && p.grasa;
      let scoreMusc = null;
      let scoreDef = null;

      if (tienePerfil) {
        const md = calcularMasaDef(Number(p.peso), Number(p.altura), Number(p.grasa), p.sexo);
        scoreMusc = md.scoreMusc;
        scoreDef = md.scoreDef;
      }

      const overall = Math.round(
        scores.scorePotencial * 0.30 +
        scores.scoreSimetria * 0.25 +
        scores.scorePostura * 0.25 +
        (scoreMusc !== null ? scoreMusc * 0.10 : 0) +
        (scoreDef !== null ? scoreDef * 0.10 : 0)
      );

      const final = { ...scores, scoreMusc, scoreDef, scoreTotal: overall };
      setResultado(final);

      // 2. Guardar scan en body_scans
      const { error: scanError } = await supabase.from("body_scans").insert({
        user_id: user.id,
        score_potencial: final.scorePotencial,
        score_simetria: final.scoreSimetria,
        score_postura: final.scorePostura,
        score_musc: final.scoreMusc,
        score_def: final.scoreDef,
        score_total: final.scoreTotal,
      });

      if (scanError) {
        console.error("Error guardando body_scans:", scanError);
        alert("Error guardando el scan: " + scanError.message);
      }

      // 3. Guardar peso y altura en profiles (CORREGIDO)
      if (perfil.peso && perfil.altura) {
        const updates = {
          weight: Number(perfil.peso),
          height: Number(perfil.altura),
        };
        if (perfil.grasa) {
          updates.body_fat = Number(perfil.grasa);
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        if (profileError) {
          console.error("Error actualizando perfil:", profileError);
          alert("Error guardando peso/altura en perfil: " + profileError.message);
        } else {
          console.log("✅ Perfil actualizado correctamente:", updates);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error al analizar. Intenta con otra foto.");
    } finally {
      setCargando(false);
    }
  };

  const getColor = (val) => {
    if (val === null) return "#64748b";
    if (val >= 80) return "#22c55e";
    if (val >= 60) return "#3b82f6";
    if (val >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const stats = resultado
    ? [
        { abbr: "POT", label: "Potencial", val: resultado.scorePotencial },
        { abbr: "SIM", label: "Simetría", val: resultado.scoreSimetria },
        { abbr: "POS", label: "Postura", val: resultado.scorePostura },
        ...(resultado.scoreMusc !== null
          ? [
              { abbr: "MUSC", label: "Masa", val: resultado.scoreMusc },
              { abbr: "DEF", label: "Definición", val: resultado.scoreDef },
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
          <h2 className="page-title bodyscan-title">Escanea tu cuerpo</h2>
          <p className="subtle">De frente, brazos ligeramente separados, buena luz y ropa ajustada.</p>
        </div>
      </div>

      <div className="bodyscan-controls">
        <label className="bodyscan-upload-button" htmlFor="bodyscan-input">
          <span>Elegir foto</span>
        </label>
        <input
          id="bodyscan-input"
          key={inputKey}
          type="file"
          accept="image/*"
          onChange={handleFoto}
          style={{ display: "none" }}
        />

        <button
          className="primary-btn bodyscan-analyze-button"
          onClick={procesarFoto}
          disabled={cargando || !foto}
        >
          {cargando ? "Procesando..." : "Analizar"}
        </button>
      </div>

      <div style={{ maxWidth: 340, width: "100%", marginTop: 20 }}>
        <p style={{ ...labelStyle, marginBottom: 10 }}>Datos opcionales</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 12px" }}>
          <div>
            <label style={labelStyle}>Peso (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="70"
              value={perfil.peso}
              onChange={(e) => handlePerfil("peso", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Altura (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="175"
              value={perfil.altura}
              onChange={(e) => handlePerfil("altura", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>% Grasa</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="18"
              value={perfil.grasa}
              onChange={(e) => handlePerfil("grasa", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Sexo</label>
            <select
              value={perfil.sexo}
              onChange={(e) => handlePerfil("sexo", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="H" style={{ background: "#1e293b", color: "#fff" }}>Hombre</option>
              <option value="M" style={{ background: "#1e293b", color: "#fff" }}>Mujer</option>
            </select>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "10px 0 0", lineHeight: 1.4 }}>
          Rellena estos campos para desbloquear Masa y Definición en tu carta.
        </p>
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
                {resultado.scoreTotal}
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
                    width: `${resultado.scoreTotal}%`,
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
              onClick={resetearTodo}
            >
              Escanear de nuevo
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default BodyScan;