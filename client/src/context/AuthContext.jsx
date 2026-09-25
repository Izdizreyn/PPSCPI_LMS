import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { getTokenExpiryMs } from "../utils/jwt";

const AuthContext = createContext(null);

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];
// If the user hasn't moved/clicked/typed in this window before the token's
// actual expiry, the resulting logout is attributed to inactivity.
const IDLE_THRESHOLD_MS = 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(null); // null | "idle" | "expired"

  const lastActivityRef = useRef(Date.now());
  const expiryTimeoutRef = useRef(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    lastActivityRef.current = Date.now();
    setSessionExpired(null);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // Track activity globally while a session is active. Uses a ref (not
  // state) so high-frequency events like mousemove don't trigger re-renders.
  useEffect(() => {
    if (!token) return undefined;

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActive));
    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, markActive),
      );
    };
  }, [token]);

  // Schedule a forced logout at the token's real expiry (read from the JWT
  // itself), regardless of activity — activity only affects which message
  // is shown afterward, since there's no refresh-token endpoint to extend
  // the session.
  useEffect(() => {
    if (expiryTimeoutRef.current) {
      window.clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }

    if (!token) return undefined;

    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return undefined;

    const msUntilExpiry = expiryMs - Date.now();

    if (msUntilExpiry <= 0) {
      logout();
      setSessionExpired("expired");
      return undefined;
    }

    expiryTimeoutRef.current = window.setTimeout(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      const reason = idleFor >= IDLE_THRESHOLD_MS ? "idle" : "expired";
      logout();
      setSessionExpired(reason);
    }, msUntilExpiry);

    return () => {
      if (expiryTimeoutRef.current) {
        window.clearTimeout(expiryTimeoutRef.current);
      }
    };
  }, [token, logout]);

  const acknowledgeSessionExpired = () => {
    setSessionExpired(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        sessionExpired,
        acknowledgeSessionExpired,
      }}
    >
      {children}
      {sessionExpired && (
        <SessionExpiredModal
          reason={sessionExpired}
          onClose={acknowledgeSessionExpired}
        />
      )}
    </AuthContext.Provider>
  );
}

function SessionExpiredModal({ reason, onClose }) {
  const message =
    reason === "idle"
      ? "You've been logged out automatically due to inactivity."
      : "Your session has expired. Please log in again.";

  const handleClose = () => {
    onClose();
    window.location.href = "/";
  };

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <h3 style={{ margin: "0 0 10px", color: "#800080" }}>Session Ended</h3>
        <p style={{ margin: "0 0 20px", color: "#333" }}>{message}</p>
        <button onClick={handleClose} style={buttonStyle}>
          OK
        </button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
};

const boxStyle = {
  background: "#fff",
  borderRadius: "8px",
  padding: "28px 32px",
  maxWidth: "360px",
  textAlign: "center",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
};

const buttonStyle = {
  padding: "10px 24px",
  background: "#800080",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "15px",
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}