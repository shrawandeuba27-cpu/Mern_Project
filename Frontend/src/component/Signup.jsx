import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon";
import { Notice } from "../ui/bits";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // simple checks on the frontend (the backend checks again)
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all the fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await axios({
        url: "http://localhost:8000/user/signup",
        method: "POST",
        data: {
          name: name,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
        },
      });

      // signup also gives us a token, so the user is logged in straight away
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("userName", result.data.user.name);
      localStorage.setItem("user", JSON.stringify(result.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Cannot reach the server");
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSignup}>
        <div className="auth-brand"><span className="logo-mark"><Icon name="box" size={18} /></span> StockSense</div>
        <h2>Create your account</h2>
        <p className="muted">It only takes a minute</p>

        <Notice>{error}</Notice>

        <div className="field">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input type="password" id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="switch-text">
          Already have an account? <Link to="/">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
