// API configuration - uses environment variable in production, falls back to localhost for development
const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export default API_BASE;
