"use client";

import React, { createContext, useContext, useState, useEffect, useEffectEvent } from "react";
import { API_URL, getApiUrl, apiFetch } from "@/utils/api";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string, phone?: string, address?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedData: { full_name: string; phone?: string; address?: string }) => Promise<boolean>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ApiRequestErrorOptions {
  status?: number;
  statusText?: string;
  responseBody?: unknown;
  rawBody?: string;
  url?: string;
  method?: string;
  isNetworkError?: boolean;
  parseError?: unknown;
}

export class ApiRequestError extends Error {
  status?: number;
  statusText?: string;
  responseBody?: unknown;
  rawBody?: string;
  url?: string;
  method?: string;
  isNetworkError: boolean;
  parseError?: unknown;

  constructor(message: string, options: ApiRequestErrorOptions = {}) {
    super(message);
    this.name = "ApiRequestError";
    Object.setPrototypeOf(this, ApiRequestError.prototype);
    this.status = options.status;
    this.statusText = options.statusText;
    this.responseBody = options.responseBody;
    this.rawBody = options.rawBody;
    this.url = options.url;
    this.method = options.method;
    this.isNetworkError = options.isNetworkError ?? false;
    this.parseError = options.parseError;
  }

  toLog() {
    return {
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      responseBody: this.responseBody,
      rawBody: this.rawBody,
      url: this.url,
      method: this.method,
      isNetworkError: this.isNetworkError,
      parseError: this.parseError,
    };
  }
}

export { API_URL } from "@/utils/api";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractBackendMessage = (body: unknown): string | null => {
  if (!body) return null;
  if (typeof body === "string") return body.trim() || null;

  if (Array.isArray(body)) {
    const messages = body
      .map((item) => extractBackendMessage(item))
      .filter((message): message is string => Boolean(message));
    return messages.length ? messages.join(" ") : null;
  }

  if (!isRecord(body)) return null;

  const detail = body.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (isRecord(item) && typeof item.msg === "string") return item.msg;
        return extractBackendMessage(item);
      })
      .filter((message): message is string => Boolean(message));
    return messages.length ? messages.join(" ") : null;
  }

  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;

  return null;
};

const readResponseBody = async (response: Response) => {
  const rawBody = await response.text();
  if (!rawBody) {
    return { responseBody: null, rawBody };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { responseBody: rawBody, rawBody };
  }

  try {
    return { responseBody: JSON.parse(rawBody) as unknown, rawBody };
  } catch (parseError) {
    return { responseBody: rawBody, rawBody, parseError };
  }
};

const createApiErrorFromResponse = async (
  response: Response,
  url: string,
  method: string,
  fallbackMessage: string
) => {
  const { responseBody, rawBody, parseError } = await readResponseBody(response);
  return new ApiRequestError(
    extractBackendMessage(responseBody) || response.statusText || fallbackMessage,
    {
      status: response.status,
      statusText: response.statusText,
      responseBody,
      rawBody,
      url,
      method,
      parseError,
    }
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("mr_laptop_token");
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const fetchProfile = async (authToken: string) => {
    try {
      const response = await apiFetch("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfileOnStartup = useEffectEvent((authToken: string) => {
    void fetchProfile(authToken);
  });

  // Load token and user on startup
  useEffect(() => {
    queueMicrotask(() => {
      const savedToken = localStorage.getItem("mr_laptop_token");
      if (savedToken) {
        setToken(savedToken);
        fetchProfileOnStartup(savedToken);
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      console.log("API_URL:", API_URL);
      console.log("requestBody (params):", params.toString());

      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      console.log("response:", response);

      if (response.ok) {
        const data = await response.json();
        const accessToken = data.access_token;
        localStorage.setItem("mr_laptop_token", accessToken);
        setToken(accessToken);
        await fetchProfile(accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login request error", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    name: string,
    password: string,
    phone?: string,
    address?: string
  ): Promise<boolean> => {
    const registerUrl = getApiUrl("/auth/register");
    const body = JSON.stringify({
      email,
      full_name: name,
      password,
      phone,
      address,
    });

    try {
      setIsLoading(true);
      console.log("REGISTER URL:", registerUrl);
      console.log("REGISTER BODY:", body);

      const response = await apiFetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      console.log("STATUS:", response.status);
      console.log("RESPONSE:", await response.clone().text());

      if (response.ok) {
        // Auto-login after registration
        return await login(email, password);
      }

      const apiError = await createApiErrorFromResponse(response, registerUrl, "POST", "Registration failed");
      console.error("Registration HTTP error", apiError.toLog());
      throw apiError;
    } catch (error) {
      console.error("FULL REGISTER ERROR:", error);
      if (error instanceof ApiRequestError) {
        throw error;
      }

      const networkError = new ApiRequestError(
        `Could not reach backend API at ${registerUrl}. Confirm FastAPI is running and CORS allows this frontend origin.`,
        {
          url: registerUrl,
          method: "POST",
          isNetworkError: true,
        }
      );
      console.error("Registration network error", {
        ...networkError.toLog(),
        originalError: error,
      });
      throw networkError;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updatedData: {
    full_name: string;
    phone?: string;
    address?: string;
  }): Promise<boolean> => {
    // For demo simplicity, update local state or mock endpoint
    if (!user || !token) return false;
    try {
      // We can mock backend profile update or just update local state
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error("Profile update error", error);
      return false;
    }
  };

  const fetchUser = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
