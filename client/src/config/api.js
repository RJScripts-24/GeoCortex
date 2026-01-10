/**
 * API Configuration
 * 
 * In development: Uses relative paths (Vite proxy handles routing to localhost:8080)
 * In production: Uses the Cloud Run backend URL from environment variable
 */

// Get the API base URL from environment variable, fallback to empty string for relative paths
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export { API_BASE_URL };
