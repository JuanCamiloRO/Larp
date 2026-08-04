export function distancia(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function normalizar(valor, min, max) {
  return Math.max(0, Math.min(100, ((valor - min) / (max - min)) * 100));
}

export function puntoMedio(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

export function simetriaPar(pIzq, pDer, centroX, refAncho, esEstructural = true) {
  const distIzq = Math.abs(pIzq.x - centroX);
  const distDer = Math.abs(pDer.x - centroX);
  const diff = Math.abs(distIzq - distDer);

  if (esEstructural) {
    const avg = (distIzq + distDer) / 2;
    if (avg < 0.0001) return 1.0;
    const raw = 1 - diff / avg;
    return Math.max(0.0, Math.min(1.0, raw));
  } else {
    const ancho = refAncho > 0.01 ? refAncho : 0.2;
    const raw = 1 - diff / ancho;
    return Math.max(0.0, Math.min(1.0, raw));
  }
}

export function calcularMasaDef(peso, altura, grasa, sexo) {
  const alturaM = altura / 100;
  const masaMagra = peso * (1 - grasa / 100);
  const ffmi = masaMagra / (alturaM ** 2);

  const scoreMusc = sexo === "M"
    ? normalizar(ffmi, 13, 20)
    : normalizar(ffmi, 15, 24);

  const scoreDef = sexo === "M"
    ? normalizar(100 - grasa, 62, 88)
    : normalizar(100 - grasa, 70, 92);

  return {
    scoreMusc: Math.round(scoreMusc),
    scoreDef: Math.round(scoreDef),
  };
}

export function calcularScores(puntos) {
  const centroX = (puntos[11].x + puntos[12].x) / 2;
  const anchoHombros = distancia(puntos[11], puntos[12]);
  const anchoCadera = distancia(puntos[23], puntos[24]);

  const cHombros = puntoMedio(puntos[11], puntos[12]);
  const cCaderas = puntoMedio(puntos[23], puntos[24]);
  const cTobillos = puntoMedio(puntos[27], puntos[28]);

  // 1. POTENCIAL
  const ratioHombroCadera = anchoCadera > 0.01 ? anchoHombros / anchoCadera : 1.0;
  const longitudTorso = distancia(cHombros, cCaderas);
  const longitudPiernas = distancia(cCaderas, cTobillos);
  const proporcion = longitudTorso > 0.01 ? longitudPiernas / longitudTorso : 1.0;
  const scoreRatio = normalizar(ratioHombroCadera, 0.7, 1.8);
  const scoreProp = normalizar(proporcion, 0.9, 1.5);
  const scorePotencial = scoreRatio * 0.6 + scoreProp * 0.4;

  // 2. SIMETRÍA
  const simHombros = simetriaPar(puntos[11], puntos[12], centroX, anchoHombros, true);
  const simCadera = simetriaPar(puntos[23], puntos[24], centroX, anchoHombros, true);
  const simCodos = simetriaPar(puntos[13], puntos[14], centroX, anchoHombros, false);
  const simRodillas = simetriaPar(puntos[25], puntos[26], centroX, anchoHombros, false);
  const simetriaPromedio = simHombros * 0.40 + simCadera * 0.40 + simCodos * 0.10 + simRodillas * 0.10;
  const scoreSimetria = normalizar(simetriaPromedio, 0.5, 1.0);

  // 3. POSTURA
  const desnivelHombros = Math.abs(puntos[11].y - puntos[12].y);
  const desnivelCadera = Math.abs(puntos[23].y - puntos[24].y);
  const refAncho = anchoHombros > 0.01 ? anchoHombros : 0.2;
  const desnivelRelativo = (desnivelHombros + desnivelCadera) / (2 * refAncho);
  const rawPostura = Math.max(0, 1 - desnivelRelativo);
  const scorePostura = normalizar(rawPostura, 0.4, 1.0);

  return {
    scorePotencial: Math.round(scorePotencial),
    scoreSimetria: Math.round(scoreSimetria),
    scorePostura: Math.round(scorePostura),
  };
}