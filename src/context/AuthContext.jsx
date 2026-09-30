import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext({
  token: null,
  user: null,
  userRole: null,
  userEmail: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

function parseJwtPayload(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("agni_token"));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("agni_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const jwtPayload = parseJwtPayload(token);
  const userRole = jwtPayload?.role || user?.role || localStorage.getItem("agni_user_role") || localStorage.getItem("agni_role");
  const userEmail = jwtPayload?.email || user?.email || localStorage.getItem("agni_user_email") || localStorage.getItem("agni_email");

  const syncAuthFromStorage = useCallback(() => {
    const curToken = localStorage.getItem("agni_token");
    let curUser = null;
    try {
      const saved = localStorage.getItem("agni_user");
      if (saved) curUser = JSON.parse(saved);
    } catch (e) {}

    setToken(curToken);
    setUser(curUser);
  }, []);

  useEffect(() => {
    // Synchronize authentication state across multiple open browser tabs in real-time
    window.addEventListener("storage", syncAuthFromStorage);
    window.addEventListener("agni_auth_changed", syncAuthFromStorage);

    return () => {
      window.removeEventListener("storage", syncAuthFromStorage);
      window.removeEventListener("agni_auth_changed", syncAuthFromStorage);
    };
  }, [syncAuthFromStorage]);

  const login = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem("agni_token", newToken);
    }
    if (newUser) {
      localStorage.setItem("agni_user", JSON.stringify(newUser));
      if (newUser.role) {
        localStorage.setItem("agni_user_role", newUser.role);
        localStorage.setItem("agni_role", newUser.role);
      }
      if (newUser.email) {
        localStorage.setItem("agni_user_email", newUser.email);
        localStorage.setItem("agni_email", newUser.email);
      }
    }
    syncAuthFromStorage();
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("agni_auth_changed"));
  }, [syncAuthFromStorage]);

  const logout = useCallback(() => {
    localStorage.removeItem("agni_token");
    localStorage.removeItem("agni_user");
    localStorage.removeItem("agni_user_role");
    localStorage.removeItem("agni_role");
    localStorage.removeItem("agni_user_email");
    localStorage.removeItem("agni_email");

    syncAuthFromStorage();
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("agni_auth_changed"));
  }, [syncAuthFromStorage]);

  const value = {
    token,
    user,
    userRole,
    userEmail,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
