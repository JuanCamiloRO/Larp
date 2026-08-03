export function distancia(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function normalizar(valor, min, max) {
  return Math.max(0, Math.min(100, ((valor - min) / (max - min)) * 100));
}

export function simetriaPar(pIzq, pDer, centroX) {
  const distIzq = Math.abs(pIzq.x - centroX);
  const distDer = Math.abs(pDer.x - centroX);
  return 1 - Math.abs(distIzq - distDer) / ((distIzq + distDer) / 2);
}

export function calcularScores(puntos) {
  const centroX = (puntos[11].x + puntos[12].x) / 2;

  const simHombros = simetriaPar(puntos[11], puntos[12], centroX);
  const simCadera = simetriaPar(puntos[23], puntos[24], centroX);
  const simCodos = simetriaPar(puntos[13], puntos[14], centroX);
  const simRodillas = simetriaPar(puntos[25], puntos[26], centroX);
  const simetriaPromedio = (simHombros + simCadera + simCodos + simRodillas) / 4;

  const anchoHombros = distancia(puntos[11], puntos[12]);
  const anchoCadera = distancia(puntos[23], puntos[24]);
  const ratioHombroCadera = anchoHombros / anchoCadera;

  const desnivelHombros = Math.abs(puntos[11].y - puntos[12].y);
  const desnivelCadera = Math.abs(puntos[23].y - puntos[24].y);

  const scoreSimetria = normalizar(simetriaPromedio, 0.7, 1.0);
  const scoreEstructura = normalizar(ratioHombroCadera, 1.0, 1.7);
  const scorePostura = normalizar(1 - (desnivelHombros + desnivelCadera), 0.9, 1.0);

  const scoreTotal = Math.round(
    scoreSimetria * 0.4 + scoreEstructura * 0.4 + scorePostura * 0.2
  );

  return { scoreSimetria, scoreEstructura, scorePostura, scoreTotal, ratioHombroCadera };
}