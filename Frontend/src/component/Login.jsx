import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon";
import { Notice } from "../ui/bits";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await axios({
        url: "http://localhost:8000/user/login",
        method: "POST",
        data: { email: email, password: password },
      });

      // keep the token and name in the browser so we stay logged in
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("userName", result.data.user.name);
      localStorage.setItem("user", JSON.stringify(result.data.user));
      navigate("/dashboard");
    } catch (err) {
      // err.response exists when the server answered with an error
      // it does not exist when the server is off
      setError(err.response?.data?.message || "Cannot reach the server");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <div className="auth-brand"><span className="logo-mark"><Icon name="box" size={18} /></span> StockSense</div>
        <h2>Welcome back</h2>
        <p className="muted">Log in to manage your inventory</p>

        <Notice>{error}</Notice>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="switch-text">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
