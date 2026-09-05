import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageBackground from "../components/PageBackground";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import "./StudentLogin.css";
import { EyeIcon, EyeOffIcon } from "../components/AdminIcons";

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/student-login.php`, {
        email,
        password,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate("/student/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageBackground variant="grid">
        <div className="student-login-container">
          <div className="student-login">
            <h2>Student Login</h2>
            <p className="subtitle">Access your student portal</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password.length > 0 && (
                    <span
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </span>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </PageBackground>
    </>
  );
}
