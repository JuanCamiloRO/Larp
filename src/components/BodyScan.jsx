// src/components/BodyScan.jsx
import { useState, useRef } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { calcularScores } from "../lib/poseUtils";
import { supabase } from '../supabase';
// import { supabase } from "../supabaseClient"; // lo usamos en el Paso 4

function BodyScan() {
  const [foto, setFoto] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const imagenRef = useRef(null);

  // --- Paso A: usuario selecciona la foto ---
  const handleFoto = (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
      setFoto(URL.createObjectURL(archivo));
    }
  };

  // --- Paso B: crear el detector de MediaPipe ---
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

  // --- Paso C: procesar la foto al pulsar el botón ---
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

  return (
    <div>
      <h2>Escanea tu cuerpo</h2>
      <p>De frente, brazos ligeramente separados, buena luz, ropa ajustada.</p>
  
      {/* Contenedor de los controles (input + botón) */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFoto} 
        />
        
        <button 
          onClick={procesarFoto} 
          disabled={cargando || !foto}
        >
          {cargando ? "Procesando..." : "Analizar"}
        </button>
      </div>
  
      {/* La imagen debajo */}
      {foto && (
        <div style={{ marginBottom: '15px' }}>
          <img 
            ref={imagenRef} 
            src={foto} 
            alt="foto body scan" 
            style={{ maxWidth: '100%', maxHeight: '400px' }} 
          />
        </div>
      )}
  
      {/* Resultados */}
      {resultado && (
        <div>
          <h3>Resultado: {resultado.scoreTotal}/100</h3>
          <p>Simetría: {Math.round(resultado.scoreSimetria)}</p>
          <p>Estructura: {Math.round(resultado.scoreEstructura)}</p>
          <p>Postura: {Math.round(resultado.scorePostura)}</p>
        </div>
      )}
    </div>
  );
}

export default BodyScan;