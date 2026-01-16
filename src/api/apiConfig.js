// src/api/apiConfig.js
// Strictly mirror legacy pattern and base URL
// (avoids localhost fallback when .env is set).

globalThis.api_uri = "http://18.143.240.114:8080";
export const API_URI = globalThis.api_uri;
