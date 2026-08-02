import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageBackground from "../components/PageBackground";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login.php`, { username, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        if (res.data.user.role === "purple_admin") navigate("/admin/dashboard");
        else if (res.data.user.role === "purple_cashier") navigate("/cashier");
        else navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <PageBackground variant="diagonal">
        <div className="login">
          <p>Staff Login</p>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password.length > 0 && (
                <i
                  className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle-password`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              )}
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </PageBackground>
    </>
  );
}