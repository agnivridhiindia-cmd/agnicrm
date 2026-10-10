import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "../services/apiClient";

const AuthContext = createContext({
  token: null,
  user: null,
  userRole: null,
  userEmail: null,
  userName: null,
  userBranch: null,
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.fullName && parsed.fullName.toLowerCase().includes("devika")) {
          localStorage.removeItem("agni_user");
          return null;
        }
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const jwtPayload = parseJwtPayload(token);
  const userRole = jwtPayload?.role || user?.role || localStorage.getItem("agni_user_role") || localStorage.getItem("agni_role");
  const userEmail = jwtPayload?.email || user?.email || localStorage.getItem("agni_user_email") || localStorage.getItem("agni_email");
  
  const rawStoredName = localStorage.getItem("agni_user_name");
  if (rawStoredName && rawStoredName.toLowerCase().includes("devika")) {
    try {
      localStorage.removeItem("agni_user_name");
    } catch (e) {}
  }
  const storedName = rawStoredName && !rawStoredName.toLowerCase().includes("devika") ? rawStoredName : null;
  const storedEmail = localStorage.getItem("agni_user_email");
  const activeEmail = user?.email || jwtPayload?.email;
  const isStoredNameValid = storedName && (!activeEmail || !storedEmail || storedEmail.toLowerCase() === activeEmail.toLowerCase());

  const userName =
    (user?.fullName && !user.fullName.toLowerCase().includes("devika") ? user.fullName : null) ||
    (user?.name && !user.name.toLowerCase().includes("devika") ? user.name : null) ||
    (jwtPayload?.name && !jwtPayload.name.toLowerCase().includes("devika") ? jwtPayload.name : null) ||
    (isStoredNameValid ? storedName : null) ||
    (userRole === "OWNER" || activeEmail?.toLowerCase().includes("agnivridhiindia@gmail.com") ? "Rahul Singh" : null);

  const userBranch = user?.branch?.name || (typeof user?.branch === "string" ? user.branch : null) || localStorage.getItem("agni_user_branch") || null;

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

  // Authoritative live sync from backend /auth/me on mount or when token updates
  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    apiFetch("/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && data?.user) {
          setUser(data.user);
          localStorage.setItem("agni_user", JSON.stringify(data.user));
          if (data.user.fullName || data.user.name) {
            localStorage.setItem("agni_user_name", data.user.fullName || data.user.name);
          }
          if (data.user.email) {
            localStorage.setItem("agni_user_email", data.user.email);
          }
          if (data.user.role) {
            localStorage.setItem("agni_user_role", data.user.role);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [token]);

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
      if (newUser.fullName || newUser.name) {
        localStorage.setItem("agni_user_name", newUser.fullName || newUser.name);
      }
      if (newUser.role) {
        localStorage.setItem("agni_user_role", newUser.role);
        localStorage.setItem("agni_role", newUser.role);
      }
      if (newUser.email) {
        localStorage.setItem("agni_user_email", newUser.email);
        localStorage.setItem("agni_email", newUser.email);
      }
      if (newUser.branch?.name) {
        localStorage.setItem("agni_user_branch", newUser.branch.name);
      }
    }
    syncAuthFromStorage();
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("agni_auth_changed"));
  }, [syncAuthFromStorage]);

  const logout = useCallback(() => {
    localStorage.removeItem("agni_token");
    localStorage.removeItem("agni_user");
    localStorage.removeItem("agni_user_name");
    localStorage.removeItem("agni_user_branch");
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
    userName,
    userBranch,
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
