// API configuration
// - Single-service deploy (Render): no env var needed, defaults to '' (same origin)
// - Separate services: set REACT_APP_API_URL to the backend URL
// - Local dev: loaded from .env.development automatically
const API_BASE = process.env.REACT_APP_API_URL || '';

export default API_BASE;
