import React, { useState } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash, FaGoogle, FaMicrosoft, FaMapMarkerAlt, FaMobileAlt, FaEnvelope, FaLock } from "react-icons/fa";
import "./Login.css"; 

const Login = ({ onLogin }) => {
  const [view, setView] = useState("login"); // 'login', 'register', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  
  // ✅ LIVE BACKEND URL
  const API_BASE_URL = "https://routeoptima-backend.onrender.com";

  // Single state object for all forms
  const [formData, setFormData] = useState({ 
    name: "", email: "", password: "", mobile: "", newPassword: "" 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Mobile field mein sirf numbers allow karne ke liye logic
    if (name === "mobile") {
      const onlyNums = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: onlyNums });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // --- VALIDATION HELPER ---
  const validateForm = (type) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;

    // Email Check (Register & Forgot)
    if ((type === "register" || type === "forgot") && !emailRegex.test(formData.email)) {
      setMessage("Please enter a valid Email Address.");
      setIsError(true);
      return false;
    }

    // Mobile Check (Register & Forgot)
    if ((type === "register" || type === "forgot") && !mobileRegex.test(formData.mobile)) {
      setMessage("Mobile Number must be exactly 10 digits.");
      setIsError(true);
      return false;
    }

    // Password Length Check (Register)
    if (type === "register" && formData.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setIsError(true);
      return false;
    }

    // New Password Length Check (Forgot)
    if (type === "forgot" && formData.newPassword.length < 6) {
      setMessage("New Password must be at least 6 characters.");
      setIsError(true);
      return false;
    }

    return true;
  };

  // --- 1. LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      alert("Welcome " + res.data.name);
      onLogin(res.data); 
    } catch (err) {
      setIsError(true);
      setMessage("Login Failed! Check Email or Password.");
    }
  };

  // --- 2. REGISTER LOGIC ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(""); // Reset message
    
    if (!validateForm("register")) return; // Validation failed

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
      alert("✅ Account Created! Please Login.");
      setView("login");
      setMessage("");
      setFormData({ name: "", email: "", password: "", mobile: "", newPassword: "" });
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data || "Registration Failed!");
    }
  };

  // --- 3. FORGOT PASSWORD LOGIC ---
  const handleForgotPassword = async (e) => {
      e.preventDefault();
      setMessage(""); // Reset message
      
      if (!validateForm("forgot")) return; // Validation failed

      try {
          await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
              email: formData.email,
              mobile: formData.mobile,
              newPassword: formData.newPassword
          });
          
          alert("✅ Password Reset Successfully!");
          setView("login");
          setMessage("");
          setIsError(false);
          setFormData({ name: "", email: "", password: "", mobile: "", newPassword: "" });
      } catch (err) {
          setIsError(true);
          setMessage(err.response?.data || "Verification Failed! Details incorrect.");
      }
  };

  return (
    <div className="login-container">
      <div className="road-wrapper"><div className="road"></div></div>
      <div className="login-card">
        <div className="brand-header">
          <div className="logo-icon-fallback"><FaMapMarkerAlt /></div>
          <h2>
            <img src="/location_icon.png" alt="" className="brand-img" />
            Route<span className="optima-text">Optima</span>
          </h2>
        </div>

        {/* --- VIEW 1: LOGIN --- */}
        {view === "login" && (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="admin@example.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input type={showPassword ? "text" : "password"} name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <div className="forgot-row">
              <label><input type="checkbox" /> Remember me</label>
              <span className="link-text" onClick={() => {setView("forgot"); setMessage(""); setIsError(false);}}>Forgot Password?</span>
            </div>
            {message && <div className={`msg-box ${isError ? 'error' : 'success'}`}>{message}</div>}
            <button type="submit" className="btn-primary">Login</button>
            <div className="divider"><span>Or continue with</span></div>
            <div className="social-buttons">
              <button type="button" className="btn-social" onClick={() => alert("Server Error! Please login using Email above.")}><FaGoogle color="#DB4437"/> Google</button>
              <button type="button" className="btn-social" onClick={() => alert("Server Error! Please login using Email above.")}><FaMicrosoft color="#00A4EF"/> Microsoft</button>
            </div>
            <p className="bottom-text">
              New User? <span className="link-text" onClick={() => {setView("register"); setMessage(""); setIsError(false);}}>Create Account</span>
            </p>
          </form>
        )}

        {/* --- VIEW 2: REGISTER --- */}
        {view === "register" && (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Mobile Number</label>
              <input type="text" name="mobile" placeholder="9876543210" maxLength="10" value={formData.mobile} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="email@domain.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="Min 6 characters" value={formData.password} onChange={handleChange} required />
            </div>
            {message && <div className={`msg-box ${isError ? 'error' : 'success'}`}>{message}</div>}
            <button type="submit" className="btn-primary">Register</button>
            <p className="bottom-text">
              Have an account? <span className="link-text" onClick={() => {setView("login"); setMessage(""); setIsError(false);}}>Login</span>
            </p>
          </form>
        )}

        {/* --- VIEW 3: FORGOT PASSWORD --- */}
        {view === "forgot" && (
            <form onSubmit={handleForgotPassword}>
                <h3 style={{textAlign:'center', color:'#334155', margin:'0 0 15px 0'}}>Reset Password</h3>
                <p style={{fontSize:'12px', color:'#64748b', textAlign:'center', marginBottom:'20px'}}>
                    Verify your identity using your registered Mobile Number.
                </p>
                <div className="input-group">
                    <label><FaEnvelope /> Email Address</label>
                    <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label><FaMobileAlt /> Mobile Number</label>
                    <input type="text" name="mobile" placeholder="10 Digit Number" maxLength="10" value={formData.mobile} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label><FaLock /> New Password</label>
                    <input type="password" name="newPassword" placeholder="Min 6 characters" value={formData.newPassword} onChange={handleChange} required />
                </div>
                {message && <div className={`msg-box ${isError ? 'error' : 'success'}`}>{message}</div>}
                <button type="submit" className="btn-primary" style={{backgroundColor:'#f59e0b'}}>Reset Password</button>
                <p className="bottom-text">
                    <span className="link-text" onClick={() => {setView("login"); setMessage(""); setIsError(false);}}>← Back to Login</span>
                </p>
            </form>
        )}
      </div>
      <div className="footer-text">© 2026 RouteOptima Logistics</div>
    </div>
  );
};

export default Login;