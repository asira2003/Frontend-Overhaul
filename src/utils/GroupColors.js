// Shared palette utility for group pills
// Persists per-group palettes in localStorage

const PALETTE_STORAGE_KEY = "userGroupColors";

function loadPaletteStore() {
  try {
    const raw = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function savePaletteStore(store) {
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(store));
  } catch (_) {
    // ignore write errors
  }
}

function paletteFromHue(h) {
  const bg = `hsl(${h}, 90%, 94%)`;
  const text = `hsl(${h}, 70%, 35%)`;
  const border = `hsl(${h}, 85%, 86%)`;
  return { bg, text, border };
}

// Golden-angle spacing for distinct hues
function nextHue(index) {
  return (index * 137) % 360;
}

export function getOrCreatePalette(key, store) {
  const k = key ? String(key) : "group";
  const paletteStore = store || loadPaletteStore();
  if (paletteStore[k]) return paletteStore[k];
  const hue = nextHue(Object.keys(paletteStore).length);
  const palette = paletteFromHue(hue);
  paletteStore[k] = palette;
  savePaletteStore(paletteStore);
  return palette;
}

export function getPaletteStyleForGroup(key, store) {
  const { bg, text, border } = getOrCreatePalette(key, store);
  return { background: bg, color: text, borderColor: border };
}

export function loadStore() {
  return loadPaletteStore();
}
