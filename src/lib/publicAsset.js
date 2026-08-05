export function publicAsset(path) {
  const base = import.meta?.env?.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
}