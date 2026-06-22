/**
 * Central API Configuration & Utility File
 * Mr_Laptop.lk
 */

const getApiBaseUrl = (): string => {
  // NEXT_PUBLIC_API_URL should be the backend base URL (e.g., https://mr-laptop-lk.onrender.com)
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanedUrl = rawUrl.replace(/\/$/, "");
  
  // Ensure the backend prefix '/api' is appended if not already present
  return cleanedUrl.endsWith("/api") ? cleanedUrl : `${cleanedUrl}/api`;
};

export const API_URL = getApiBaseUrl();

/**
 * Helper to build a complete API URL for a given path.
 * Handles paths starting with or without a leading slash.
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.replace(/^\//, "");
  return `${API_URL}/${cleanPath}`;
};

/**
 * Reusable fetch wrapper that automatically handles endpoint resolution.
 */
export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const url = getApiUrl(path);
  return fetch(url, options);
};
